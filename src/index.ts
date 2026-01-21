import express from "express"
import cors from "cors"
import bodyParser from "body-parser"
import { mainRouter } from "./routes/index"
const app = express()

app.use(cors());
app.use(express.json())

app.use("/api/v1", mainRouter);

app.listen(3000);
console.log("Listening on port 3000");
