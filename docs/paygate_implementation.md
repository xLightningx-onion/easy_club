Here is a detailed summary and markup-ready outline of the relevant portions of the DPO PayGate “PayHost” integration documentation, focusing especially on authentication, card tokenisation (Vault), and how you would implement a full host-to-host integration with card-token saving for future payments. You can hand this to a code-generation agent (e.g., Codex) as a precise spec.

⸻

Authentication & Configuration

Authentication
	•	All DPO PayGate products (including PayHost) require authentication via two elements: PayGate ID and a password/encryption key (depending on product).  ￼
	•	For PayHost: you pass in the <PayGateId> and <Password> nodes in the SOAP request under the <Account> element.  ￼
	•	Example in XML for PayHost:

<Account>
  <PayGateId>10011072130</PayGateId>
  <Password>test</Password>
</Account>
```  [oai_citation:2‡docs.paygate.co.za](https://docs.paygate.co.za/?utm_source=chatgpt.com)  


	•	The password (set in the Merchant Access Portal) must match what you send, otherwise transactions are rejected.  ￼
	•	Note: For PayWeb there’s an encryption key used for MD5 checksum; for PayHost it uses the password + SOAP envelope auth. (Although the docs also cover checksum for responses)  ￼

Configuration on Merchant Account
	•	In your PayGate account (via Merchant Access Portal) you configure:
	•	Which credit card brands you accept (Visa, MasterCard by default)  ￼
	•	Whether Auto-Settle is ON or OFF (default ON) i.e. whether settlement happens immediately or you explicitly send a settlement request.  ￼
	•	Whether to allow unauthenticated (3D Secure) transactions (default is OFF) if your merchant profile has 3D Secure enabled.  ￼

Endpoints
	•	All PayHost messages (SOAP) are to this endpoint:
POST https://secure.paygate.co.za/payhost/process.trans  ￼
	•	The WSDL is available: GET https://secure.paygate.co.za/payhost/process.trans?wsdl  ￼

⸻

PayHost Core Flow – Host-to-Host with Card Tokenisation

General Flow
	1.	Your system (merchant) constructs a SOAP request message (PaymentRequest or similar) with all required details (account, order, customer, card details OR vault token).  ￼
	2.	You send the SOAP request via HTTPS to the PayHost endpoint.
	3.	PayGate responds synchronously (or in some cases asynchronously) with a response object.
	4.	If a redirect is needed (for 3D Secure or redirect payment method) then the response will contain a redirect URL + key/value pairs which you must POST the customer’s browser to.  ￼
	5.	Optionally, if you set a NotifyUrl in the request, PayGate will POST the result to that URL (server-to-server) so you can process the outcome without relying on the user’s browser.  ￼
	6.	On return to your site (via redirect) you inspect transaction status, result code, risk indicator, and handle accordingly.

SOAP Request Types for Card + Token & Tokenisation

The docs list a number of request message types including (for PayHost):
	•	CardPaymentRequestType (when sending full card details)  ￼
	•	TokenPaymentRequestType (when sending a token rather than full card)  ￼
	•	VaultRequestType / CardVaultRequest / LookupVaultRequest / DeleteVaultRequest for tokenisation lifecycle.  ￼

Card Tokenisation (Vault)
	•	The service called “PayVault” is the card tokenisation service by PayGate; when enabled on your account you can store card PAN + expiry in PayGate’s PCI-compliant vault, and receive a token (GUID) you can store locally.  ￼
	•	When you send a transaction request with full card details and you include the element indicating Vault = true (or some “Vault” flag) then on a successful payment (or optionally even on failure if configured) PayGate will issue a token and return VaultId in the response.  ￼
	•	You can thereafter process new payments using the VaultId rather than sending full card details; in those requests you send the token, plus usually you still send CVV and maybe expiry (or maybe only CVV, depending on config).  ￼
	•	Validation rules for tokens:
	•	Vault must be enabled on your merchant profile.  ￼
	•	The VaultId must be valid (not deleted/expired) and applicable for the payment method.  ￼
	•	If you send a VaultId without specifying a PAY_METHOD when multiple payment methods are enabled, the payment method associated with the token will be used, but the user may have option to change.  ￼

Implementation Outline (for your system)

Given you want to save cards for future easy payment, here is an outline:
	1.	Enable Vault on your PayGate profile (contact support if needed).
	2.	When a user makes an initial payment:
	•	Build SOAP request CardPaymentRequestType or similar, including full card PAN, expiry, CVV, customer details, order, etc.
	•	Include flag: <Vault>true</Vault> (or equivalent) so that PayGate will tokenise the card on success.
	•	Send via PayHost endpoint.
	•	On success: capture and store response fields including <VaultId> (token GUID) returned by PayGate. Also get last-4 digits and expiry if returned (via VaultData1, VaultData2).  ￼
	•	Store locally (in your secure PCI-compliant token-store) the VaultId against your customer record. Do not store full PAN.
	3.	For future payments by that user (e.g., “Pay with saved card”):
	•	Build SOAP request TokenPaymentRequestType (or in CardPayment you send VaultId instead of PAN).
	•	Include <VaultId>the_token_guid</VaultId>. You may still need to pass CVV and/or expiry depending on config.
	•	Send via PayHost endpoint.
	•	On response: validate transaction outcome, risk indicator, etc. Update your records accordingly.
	4.	Support lifecycle operations:
	•	If user deletes a saved card: send DeleteVaultRequest with token to disable it.
	•	If you need to lookup details of a token: use LookupVaultRequest.
	•	If you support multiple cards per user, maintain mapping of user→token(s) → last-4/expiry for display.
	5.	Handle 3D Secure / redirect flows maybe needed depending on card and acquisition bank (see below).

⸻

Authentication & 3D Secure / Risk Indicators

3D Secure and Risk Indicator
	•	For card payments, especially Visa/MasterCard, PayGate supports 3D Secure via:
	•	No 3D Secure
	•	3D Secure using PayGate’s MPI
	•	3D Secure using merchant’s own MPI  ￼
	•	When a redirect is required (for 3D Secure), PayHost will respond with a RedirectResponseType containing a URL + key/value pairs. Merchant must POST the customer’s browser to that URL.  ￼
	•	On return from the bank MPI and/or on completion, PayGate returns the result and includes a field RiskIndicator. The first character indicates authentication status:
	•	‘A’ means authenticated → charge-back protection applies.  ￼
	•	‘N’ means not authenticated/registered → charge-back risk remains with merchant.  ￼
	•	Example: In response:

RISK_INDICATOR=AX

Means first char ‘A’ = authenticated; second char ‘X’ reserved.  ￼

Settlement vs Authorisation
	•	With Auto-Settle = ON (default), an approved authorisation immediately becomes settled; you don’t need to send a separate settlement request.  ￼
	•	If you disable Auto-Settle (via configuration), you will need to explicitly send a Settlement request to move funds from authorisation to settlement. Useful if you want to capture later.
	•	For tokenised future payments, you likely will have settlement on each transaction unless you choose otherwise.

⸻

Example Markup Spec for Codex Agent

Here’s a markup (e.g., Markdown or pseudo-YAML) spec you can supply to your agent. (You may adapt field names according to your chosen SOAP library.)

# PayHost Integration Spec (DPO PayGate)

## Account / Authentication
- Endpoint: `https://secure.paygate.co.za/payhost/process.trans`
- WSDL: `?wsdl` at same base URL
- In SOAP request include:
  ```xml
  <Account>
    <PayGateId>{YOUR_PAYGATE_ID}</PayGateId>
    <Password>{YOUR_PAYHOST_PASSWORD}</Password>
  </Account>

	•	Ensure the password matches the one in Merchant Access Portal.
	•	Configure accepted card brands, Auto-Settle, allowUnauthenticatedTransactions as per merchant profile.

Tokenisation (Vault) Setup
	•	Confirm Vault (PayVault) is enabled on merchant profile.
	•	On initial payment request include flag:

<Vault>true</Vault>


	•	If using existing token:

<VaultId>{TOKEN_GUID}</VaultId>


	•	In response you may receive:

<VaultId>{TOKEN_GUID}</VaultId>
<VaultData1>{last4 or descriptor}</VaultData1>
<VaultData2>{expiry or descriptor}</VaultData2>


	•	Store token GUID locally linked to user record; do not store PAN or full card details.

Payment Request Flow (Initial Payment + Token Creation)
	1.	Construct SOAP request of type CardPaymentRequestType including:
	•	Account block (PayGateId, Password)
	•	Customer details (PersonType)
	•	Order details (OrderType: amount in cents, currency code, etc.)
	•	Card details (PAN, expiry, CVV, cardholder name)
	•	Vault flag = true (if you intend to tokenise)
	•	Possibly RiskType if using fraud/risk features
	•	Possibly RedirectRequestType if redirect/pay methods
	2.	Send SOAP request to endpoint.
	3.	Receive response:
	•	If RedirectResponseType → you must POST browser to returned URL with key/value pairs.
	•	Else process synchronous result: check <TransactionStatus> field (1 = approved) and <ResultCode> (e.g., 990017 = approved) and <AuthCode> (non-blank).
	4.	If approved and tokenisation requested, capture VaultId.
	5.	Link the token (VaultId) to your internal user identifier + store metadata (last4 digits, expiry) from VaultData if provided.

Subsequent Payment Using Saved Card (Token)
	•	Construct SOAP request of type TokenPaymentRequestType (or same request type but including <VaultId> instead of full card PAN).
	•	Include Account block.
	•	Include VaultId.
	•	Still send CVV and expiry if required by your merchant configuration.
	•	Include order details, amount, currency.
	•	Include RiskType and other fields as required.
	•	Send request.
	•	Process response: check transaction status, risk indicator, etc.
	•	Handle success/failure accordingly.

Response Handling & Security
	•	For every response, verify data integrity via checksum where applicable (for some flows) – ensure you validate risk indicator and transaction status.
	•	For risk / 3D Secure: If RiskIndicator first character = ‘A’, you have authentication and charge-back protection; if ‘N’, you must handle accordingly.
	•	Ensure you store transaction identifiers (TransactionId, PayRequestId) in your system for future reference.
	•	Implement NotifyUrl endpoint if you want asynchronous server-to-server confirmation: PayGate will POST data to your notify URL before redirecting customer. Respond with plain text 'OK'.

Edge Cases & Token Lifecycle
	•	If user deletes a card: call DeleteVaultRequest with VaultId to disable token.
	•	If you need to display saved cards: use LookupVaultRequest to fetch token details.
	•	If a token is expired or invalid, transactions with that VaultId will fail — handle gracefully.
	•	If multiple payment methods active and you send VaultId without specifying payment method, the method associated with the token will be used by default.

Example XML Snippet (Initial Payment + Tokenise)

<PaymentRequest>
  <Account>
    <PayGateId>10011072130</PayGateId>
    <Password>YOUR_PASSWORD</Password>
  </Account>
  <Customer>
    <FirstName>John</FirstName>
    <LastName>Doe</LastName>
    <Email>john.doe@example.com</Email>
    <!-- other customer fields -->
  </Customer>
  <Order>
    <MerchantOrderId>order-12345</MerchantOrderId>
    <Amount>5000</Amount>        <!-- in cents => R50.00 -->
    <Currency>ZAR</Currency>
    <!-- other order fields -->
  </Order>
  <Card>
    <CardNumber>4111111111111111</CardNumber>
    <ExpiryMonth>12</ExpiryMonth>
    <ExpiryYear>2028</ExpiryYear>
    <CVV>123</CVV>
    <CardHolderName>John Doe</CardHolderName>
  </Card>
  <Vault>true</Vault>
  <Risk>
    <IpV4Address>198.51.100.23</IpV4Address>
    <SessionId>sess-abcdef</SessionId>
  </Risk>
</PaymentRequest>

Example XML Snippet (Payment Using Saved Token)

<PaymentRequest>
  <Account>
    <PayGateId>10011072130</PayGateId>
    <Password>YOUR_PASSWORD</Password>
  </Account>
  <Customer>
    <CustomerId>user-456</CustomerId>
    <!-- you may omit cardholder name etc if token already covers it -->
  </Customer>
  <Order>
    <MerchantOrderId>order-67890</MerchantOrderId>
    <Amount>7500</Amount>        <!-- R75.00 -->
    <Currency>ZAR</Currency>
  </Order>
  <VaultId>GUID-TOKEN-1234-5678</VaultId>
  <CVV>321</CVV>                 <!-- if required -->
  <Risk>
    <IpV4Address>198.51.100.23</IpV4Address>
    <SessionId>sess-ghijkl</SessionId>
  </Risk>
</PaymentRequest>


⸻

Summary
	•	Use PayGate ID + Password to authenticate PayHost SOAP calls.
	•	Enable Vault tokenisation so you can store cards for future use.
	•	On first payment: send full card + Vault flag → receive token. On subsequent payments: send token (VaultId).
	•	Handle 3D Secure flows, risk indicator for authentication and charge-back protection.
	•	Use Auto-Settle or manual settlement depending on your business logic.
	•	Use NotifyUrl for asynchronous notifications if you wish.
	•	Securely store tokens (VaultIds) and metadata (last4 digits, expiry) in your system; avoid storing PAN/CVV.
	•	Implement token lifecycle operations (lookup, delete) as needed.

⸻

If you like, I can generate full sample SOAP envelope templates (with all required/optional fields) for each of: initial payment + token, subsequent payment with token, and token deletion. Would you like that?