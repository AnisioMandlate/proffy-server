import express from "express";
import db from "./database/connection";
import convertHourtoMinutes from "./utils/convertHourtoMinutes";

const routes = express.Router();

interface scheduleItem {
  week_day: number;
  from: string;
  to: string;
}

routes.post("/classes", async (req, res) => {
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
});

export default routes;
