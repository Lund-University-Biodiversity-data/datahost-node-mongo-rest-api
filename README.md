# node-mongo-rest-api

// https://nordicapis.com/building-a-restful-api-using-node-js-and-mongodb/
sudo apt-get install npm
npm init -y 

=> creates package.json

touch app.js

npm install express mongodb body-parser --save
npm i json2csv
=> install some packages



// run production

sudo npm install -g pm2

// launch 
pm2 start app.js

pm2 stop app.js
pm2 delete app.js
pm2 list




scp /home/mathieu/Downloads/dwca-lu_sft_std-v1.6/sft_sample.json radar@canmove-dev.ekol.lu.se:/home/radar/

mongoimport -d dwca-datahost -c events sft_sample.json  --jsonArray
