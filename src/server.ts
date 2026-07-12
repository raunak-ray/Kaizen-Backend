import express from "express";
import "dotenv/config";

const app = express();

function startServer() {
    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
        console.log(`Server started on http://localhost:${PORT}`);
    }) 
}

startServer();