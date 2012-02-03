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

namespace :deploy do
  task :start, :roles => :app, :except => { :no_release => true } do
    run "#{sudo} start #{application}"
  end
  
  task :stop, :roles => :app, :except => { :no_release => true } do
    run "#{sudo} stop #{application}"
  end
  
  task :restart, :roles => :app, :except => { :no_release => true } do
    run "#{sudo} restart #{application}"
  end
end

task :uname do
  run "uname -a"
end
