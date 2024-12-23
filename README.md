# QuillQuest - Improving A2-B2 English Argumentative Essay Writing Skills through LLM Assistance and Social Interaction
  A social media web application where users can create posts, comment, reply, and interact. It integrates AI to assist users with advisor chatbot and generating prompts (initial topic), enhancing creativity. Also with the writing statistics to see improving before complete the writing.
## Getting Started
### Prerequisites
- **Git version control**: Intalled locally
- **Node.js**: v16+ required
- **MongoDB**: Installed locally or via cloud (MongoDB Atlas)
- **GROQ cloud**: Sign in and Create an API key from https://console.groq.com/keys

### Installation
1. Clone the repository:
```
git clone https://github.com/markpakkawat/quillquest-u.git
```
2. Install dependencies:
   
`npm i` or `npm install` both on the frontend and backend

3. Give permission for current IP address on MongoDB Atlas:

- Sign in MongoDB website at https://www.mongodb.com/ . 

- Add a new project and Create a cluster on `DATABASE` section -> `Clusters` . Select free plan.

- Then, Add new database user to get the contection string on `Security` section -> `Database Access`. Do note the password to be used in connection string.

- After created a cluster and added database user, then lead to -> `Security` section -> `Network Access` | and add your IP into a list

### Setting up environment variable
Add .env file with these variables base
#### Frontend `.env`
```
REACT_APP_API_BASE_URL= http://localhost:5000/api
REACT_APP_SOCKET_URL= http://localhost:5000
REACT_APP_GROQ_API_KEY= your_GROQ_api_key
```
#### Backend `.env`
```
PORT= 5000
MONGO_URI= your_mongodb_connection_string
JWT_SECRET= your_jwt_secret #or set to anythings
REACT_APP_GROQ_API_KEY= your_GROQ_api_key
FRONTEND_URL= http://localhost:3000
EMAIL_USER= your_email
EMAIL_PASS= your_password #(suggest using App password)
EMAIL_HOST= smtp.gmail.com #or your prefered email host
EMAIL_PORT= 587 #or depend on email host
```
### Running the app
- Frontend:
```
cd /frontend/
npm start
```
- Backend:
```
cd /backend/
npm run dev
```

## Tech Stack
### **Frontend**
- **Framework**: React.js
- **Styling**: Tailwind CSS

### **Backend**
- **Framework**: Node.js with Express
- **Database**: MongoDB (NoSQL)

### **AI Integration**
- Llama3 and LangChain via GROQ Cloud

### **Authentication:** 
- JWT (JSON Web Tokens), Bcrypt for password hashing


## Folder Structure
/backend

    ├── middlewares
    
    ├── controllers
    
    ├── models
    
    ├── routes
    
    └── utils

/frontend

    ├── public
    
    └── src

        ├── assets
        
        ├── context
      
        ├── components
        
        ├── pages
        
        ├── services
        
        └── utils

## Contact
- Micko kok

Address: 1315,3, Sira Mansion 9/3, Soi Pracha Uthit 26, Pracha Uthit Road

Email: 64130500203@ad.sit.kmutt.ac.th

Phone: 0823536704

- Pakkawat Wassa

Address: 45/1, Baan Akenake, Pracha Uthit Road

Email: 64130500239@ad.sit.kmutt.ac.th

Phone: 0928613737

- Winanya Buakaew

Address: 3/2 AnamaiNgamJaroen 25 Section 2-2, Thakham

Email: 64130500268@ad.sit.kmutt.ac.th

Phone: 0910052321


