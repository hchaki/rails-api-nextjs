class ApplicationController < ActionController::API
  include ActionController::Cookies
  include Authenticable
end
