import { Request, Response } from "express";
import db from "../database/connection";
import convertHourtoMinutes from "../utils/convertHourtoMinutes";

interface scheduleItem {
  week_day: number;
  from: string;
  to: string;
}

export default class ClassesControlers {
  async index(req: Request, res: Response) {
    const filters = req.query;
    if (!filters.week_day || !filters.subject || !filters.time) {
      return res.status(400).json({
        error: "Missing filters to search for classes!",
      });
    }

    const timeInMinutes = convertHourtoMinutes(filters.time as string);

    const classes = await db("classes")
      .whereExists(function () {
        this.select("class_schedule.*")
          .from("class_schedule")
          .whereRaw("`class_schedule`.`class_id` = `class_id`")
          .whereRaw("`class_schedule`.`week_day` = ??", [
            Number(filters.week_day as string),
          ])
          .whereRaw("`class_schedule`.`from` <= ??", [timeInMinutes])
          .whereRaw("`class_schedule`.`to` > ??", [timeInMinutes]);
      })
      .where("classes.subject", "=", filters.subject as string)
      .join("users", "classes.user_id", "=", "users.id")
      .select(["classes.*", "users.*"]);
    return res.json(classes);
  }

  async create(req: Request, res: Response) {
    const { name, avatar, whatsapp, bio, subject, cost, schedule } = req.body;
    const trx = await db.transaction();

    try {
      const insertedUser = await trx("users").insert({
        name,
        avatar,
        whatsapp,
        bio,
      });

      const user_id = insertedUser[0];

      const insertedClass = await trx("classes").insert({
        subject,
        cost,
        user_id,
      });

      const class_id = insertedClass[0];

      const classSchedule = schedule.map((scheduleItem: scheduleItem) => {
        return {
          week_day: scheduleItem.week_day,
          from: convertHourtoMinutes(scheduleItem.from),
          to: convertHourtoMinutes(scheduleItem.to),
          class_id,
        };
      });

      await trx("class_schedule").insert(classSchedule);

      await trx.commit();

      return res.status(201).send();
    } catch (err) {
      trx.rollback();
      return res.status(400).json({
        error: "Unexpected error while creating class",
      });
    }
  }
}
