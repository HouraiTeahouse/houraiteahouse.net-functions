# Email Module for houraiteahouse.net
An automated email-notification module designed to run on Google Cloud Functions andhandle user-submitted contribution forms.

## Setup
1. Setting up a Google Cloud Platform project
2. Create and register SendGrid account
3. Create a Cloud Function
4. Set up environment variables

### 1. Setting up a Google Cloud Platform Project
Aside from creating or using an existing project on the Google Cloud Platform, some additional set up is required:
1. Enable Google Cloud Functions, if you are using an existing project with GCF, the API is probably already enabled.
2. Enable SendGrid Email API. Search for "SendGrid Email" and follow the instructions provided by its overview page.

### 2. Create and register a SendGrid Account: https://app.sendgrid.com/
1. Generate a unique API Key on the SendGrid website. Path: Settings > API Keys > Create API Key
2. The API key will have to be stored as an env variable for the node module to reference. More on that later.

### 3. Create a Cloud Function
1. Make sure the appropriate project is selected before creatinga cloud function Path: Navigation Menu > Cloud Functions > Create Function
2. Import content of this repo's index.js into the cloud function's index.js
3. Import the content of this package.json into the cloud function's package.json. For more information on the dependencies, see below.

### 4. Configuring .env
1. To set env variables for a Cloud Function, edit the function.
2. Under the index.js tab, expand the "More" section.
3. Add a new row to the list. More information about the env variables themselves are availabe in this repo's index.js.

### What's next?
After following these steps, Cloud Functions will automatically deploy your module after creating / editing the function. In order to actually use the now ready Cloud Function, get its URL from the Trigger tab of the Function overview.

### Additional Information
1. Dependencies:
    1. @sendgrid/mail: This module provides an interface for only basic emailing with SendGrid. For more information on what else is available, see its github page: https://github.com/sendgrid/sendgrid-nodejs#usage
    2. node-schedule: A task-scheduling module: https://github.com/node-schedule/node-schedule
2. Concerns:
    - I am also uncertain about Google's protocol for persisting module environments. If it operates how I imagine (kills the environment after X time of inactivity), then the current implementation for IP-tracking is ineffective. It currently requires its environment to persist, otherwise the list is cleared whenever the environment is closed.
    - I did not design the module to be flexible in implementation. That is, it is designed specifically to handle POST requests and process them into a single, pre-defined emailing template. If a time comes where additional request handlers are needed for the website, I'll come up with a generic solution.
