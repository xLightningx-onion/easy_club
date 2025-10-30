require "sidekiq/web"
Rails.application.routes.draw do
  resource :example, constraints: -> { Rails.env.development? }
  devise_for :users, controllers: {
    registrations: "users/registrations",
    sessions: "users/sessions",
    omniauth_callbacks: "users/omniauth_callbacks"
  }

  namespace :users do
    resource :mobile_verification, only: %i[new create], controller: "mobile_verifications" do
      get :verify
      post :confirm
      post :resend
    end
  end

  match "/google-auth/success",
        to: "users/omniauth_callbacks#google_oauth2",
        via: %i[get post],
        as: :google_oauth2_callback

  get "up" => "rails/health#show", as: :rails_health_check

  scope module: :public, as: :public do
    resources :clubs, only: %i[index show], path: "clubs"
  end

  namespace :club do
    resource :dashboard, only: :show

    resources :members do
      resources :consents, only: %i[index new create]
    end

    resources :consent_types, only: :index

    resources :invoices, only: %i[index show] do
      post :pay, on: :member
      get :download, on: :member
    end

    resources :teams do
      get :squad, on: :member
      get :match_sheet, on: :member
      resources :fixtures, only: %i[index create]
    end

    resources :fixtures, only: %i[show update] do
      patch :availability, on: :member
    end

    resources :broadcasts, only: %i[index new create show]

    resources :reports, only: :index do
      collection do
        get :finance
        get :participation
        get :compliance
        get :ar_aging
      end
    end
    resources :plans, only: :index
    root "dashboard"
  end

  namespace :admin do
    mount Sidekiq::Web => "/sidekiq" # access it at http://localhost:3000/sidekiq
    resource :dashboard, only: :show
    resources :clubs do
      post :impersonate, on: :member
      patch :remove_file, on: :member
      resources :membership_types,
                module: :clubs,
                except: %i[index] do
        resources :price_tiers,
                  module: :membership_types,
                  except: %i[index show]
      end
      resources :default_price_tiers,
                module: :clubs,
                except: %i[index]
      resources :membership_questions,
                module: :clubs,
                except: %i[index]
      resources :medical_questions,
                module: :clubs,
                except: %i[index] do
        patch :toggle, on: :member
      end
      resources :terms,
                module: :clubs,
                except: %i[index]
      resources :staggered_payment_plans,
                module: :clubs,
                except: %i[index show]
      resources :memberships,
                module: :clubs,
                only: %i[index show]
    end
    resources :users
    resources :members, only: %i[index show]
    resources :orders, only: %i[index show]

    resources :invoices, only: %i[index show] do
      collection { get :reconciliation }
    end

    resources :broadcasts, only: %i[index show update] do
      post :approve, on: :member
    end

    resources :audits, only: :index
    resources :retention_jobs, only: %i[index create]

    namespace :webhooks do
      resources :payments, only: :create
      resources :whatsapp, only: :create
    end

    root "dashboard"
  end

  namespace :members do
    resource :selection, only: :new do
      get :search
    end
    resource :dashboards
    get "" => "dashboards#index"
    resource :membership_registration, only: %i[show update]
    resource :cart, only: :show do
      resources :items, controller: "cart_items", only: %i[create update destroy]
    end
    resource :checkout, only: :create
    resources :payment_methods, only: :destroy
    resources :orders, only: :show
    get "checkout/success", to: "checkouts#success", as: :checkout_success
    get "checkout/failure", to: "checkouts#failure", as: :checkout_failure
  end

  root "members/dashboards#index"
end
