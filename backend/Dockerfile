FROM  ruby:3.2.6

# 最新のパッケージ情報を取得
RUN apt-get update -qq \
    && apt-get install -y --no-install-recommends \
        nodejs \
        mariadb-client \
        default-libmysqlclient-dev \
        build-essential \
        vim \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY Gemfile /app/Gemfile
COPY Gemfile.lock /app/Gemfile.lock
RUN gem install bundler
RUN bundle install
COPY . /app
COPY entrypoint.sh /usr/bin
RUN chmod +x /usr/bin/entrypoint.sh
ENTRYPOINT ["entrypoint.sh"]
EXPOSE 3002
CMD ["rails", "server", "-b", "0.0.0.0"]