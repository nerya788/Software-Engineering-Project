// Main configuration file

// Vite automatically detects if the app is running in Production (Build) or Development (Dev) mode

export const API_URL = import.meta.env.PROD 
  ? "https://wedding-planner-api-s9so.onrender.com" // Production URL (Render)
  : "http://localhost:4000"; // Development URL (Localhost)

/** 
Notes:

1. To run locally: Make sure the backend server is running on port 4000 
(if not, run "npm run dev" in the backend folder to start it), 
Then run "npm run dev" in the frontend folder AND 

2. To run on Render: Use the client link provided by Render.
*/