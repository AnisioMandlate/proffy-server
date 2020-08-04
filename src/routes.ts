import express from "express";
import ClassesControlers from "./controllers/ClassControllers";

const routes = express.Router();
const classesControllers = new ClassesControlers();

routes.get("/classes", classesControllers.index);
routes.post("/classes", classesControllers.create);

export default routes;
