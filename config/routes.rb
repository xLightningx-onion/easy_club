Rails.application.routes.draw do
  devise_for :users

  get "up" => "rails/health#show", as: :rails_health_check

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
  end

  namespace :admin do
    resource :dashboard, only: :show
    resources :clubs do
      post :impersonate, on: :member
    end
    resources :users

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
  end

  root "club/dashboard#show"
end
