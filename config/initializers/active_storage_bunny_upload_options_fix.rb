# config/initializers/active_storage_bunny_upload_options_fix.rb
# Rails 7/8-compatible monkey patch
ActiveStorage::Service::BunnyService.prepend(Module.new do
  private
  # The gem calls **upload_options in url_for_direct_upload,
  # but never defines this. Return an empty hash.
  def upload_options
    {}
  end
end)
