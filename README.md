### Review documentation quickly to understand how to use webdriver.io:
* https://webdriver.io/docs/api/browser/url/
* https://webdriver.io/docs/selectors
* https://webdriver.io/docs/pageobjects
* https://webdriver.io/docs/selectors/#deep-selectors
* https://webdriver.io/docs/api/element/waitForDisplayed

### Review documentation quickly to understand how to use ChaiJS as library of assertion:
https://www.chaijs.com/api/bdd/

##### Prerequisites
* NodeJS LTS (20.11.0)
* Google Chrome


Create the following scenarios using this project (https://github.com/ldelosreyesm/technical_test.git) with webdriver.io and cucumber, just download and run `npm i`.  
Run `make wrer-module arg=login` to check that it went well. You should see a cucumber report successfully done in your browser.  
Then just add your features files in the features folder and their definitions (JavaScript) in step-definitions. Use POM is optional.  
Use assertions.  
Add tag under scenario.  

### Run your scenario with this line:
`make wrer-module arg=YOURSCENARIOTAG`
