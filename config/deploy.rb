set :repository, "git@github.com:gotryiton/image_scraper.git"
set :scm, :git
set :application, "scraper"
set :deploy_to, "/var/node/scraper"
set :user, "nodedeployer"
set :keep_releases, 6

set :stages, %w[dev staging production]
set :default_stage, 'dev'

require 'capistrano/ext/multistage'

set :deploy_via, :remote_cache
set :copy_exclude, [".git", ".DS_Store", ".gitignore", ".gitmodules"]

namespace :scraper do
  task :restart, :roles => :app, :except => { :no_release => true } do
    run "#{sudo} service #{application} restart"
  end
end

task :uname do
  run "uname -a"
end

after "deploy:symlink", "scraper:restart"