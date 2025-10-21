class ApplicationController < ActionController::Base
  include CableReady::Broadcaster
  include ActionPolicy::Controller

  # Only allow modern browsers supporting webp images, web push, badges, import maps, CSS nesting, and CSS :has.
  allow_browser versions: :modern

  around_action :set_current_club_context
  helper_method :current_club

  protected

  def after_sign_in_path_for(resource)
    stored_location_for(resource) || default_signed_in_path_for(resource)
  end

  private

  def default_signed_in_path_for(resource)
    if resource.respond_to?(:staff?) && resource.staff?
      club_root_path
    elsif resource.respond_to?(:club_roles) && resource.club_roles.exists?
      club_root_path
    else
      members_dashboards_path
    end
  end

  def set_current_club_context
    return yield if admin_namespace?

    Club.with_current(resolve_club_from_request) do
      yield
    end
  end

  def resolve_club_from_request
    if (impersonated = session[:impersonated_club_id])
      club = Club.find_by(id: impersonated)
      return club if club
    end

    host = request.host
    domain = host.split(":").first
    subdomain = request.subdomains.first

    Club.find_by(primary_domain: domain) ||
      Club.find_by(subdomain:) ||
      Club.first
  end

  def current_club
    Club.current
  end

  def admin_namespace?
    controller_path.start_with?("admin/")
  end

  def authorize!(record, query = nil, **options)
    context = options.delete(:context) || {}
    options[:context] = context.merge(club: current_club)
    options[:to] = query if query
    super(record, **options)
  end

  def policy_scope(scope)
    relation =
      if scope.is_a?(Class) && scope < ActiveRecord::Base
        scope.all
      else
        scope
      end

    authorized_scope(relation, type: :relation, context: { club: current_club })
  end

  rescue_from ActionPolicy::Unauthorized do |_exception|
    redirect_back fallback_location: root_path, alert: "You are not authorized to perform that action."
  end
end
