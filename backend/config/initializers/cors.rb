# Be sure to restart your server when you modify this file.

# Avoid CORS issues when API is called from the frontend app.
# Handle Cross-Origin Resource Sharing (CORS) in order to accept cross-origin Ajax requests.

# Read more: https://github.com/cyu/rack-cors

Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    # 環境変数から取得、デフォルトは localhost:8000
    # 正規表現もサポート
    origins_config = ENV.fetch("CORS_ALLOWED_ORIGINS", "localhost:8000,127.0.0.1:8000").split(",").map do |origin|
      # 正規表現パターン（例: *.vercel.app）を処理
      if origin.include?("*")
        # * を .* に変換して正規表現化
        Regexp.new(origin.gsub(".", "\\.").gsub("*", ".*"))
      else
        origin
      end
    end

    origins(*origins_config)

    resource "*",
      headers: :any,
      methods: [:get, :post, :put, :patch, :delete, :options, :head]
  end
end
