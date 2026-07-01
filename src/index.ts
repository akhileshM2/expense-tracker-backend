import express from "express"
import cors from "cors"
import bodyParser from "body-parser"
import { mainRouter } from "./routes/index"
const app = express()

app.use(cors());
app.use(express.json())

app.use("/api/v1", mainRouter);

const port = process.env.PORT || 3000;
app.listen(port as number, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
});
