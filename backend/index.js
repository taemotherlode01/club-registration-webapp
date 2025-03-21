const express = require("express");
const mysql = require("mysql");
const bcrypt = require("bcrypt");
const cors = require("cors");
const LocalStorage = require("node-localstorage").LocalStorage;
const localStorage = new LocalStorage("./scratch"); 
const app = express();
const multer = require("multer");
const XLSX = require("xlsx");
const upload = multer({ dest: "uploads/" });

app.use(express.json());
app.use(
  cors({
    origin: "https://club-registration-production.up.railway.app", 
    credentials: true, 
  })
);

const pool = mysql.createPool({
  host: "shuttle.proxy.rlwy.net",
  user: "root",
  password: "ILwVlSaoQJYFPNDoLfiaHsYVOYJdRREB",
  database: "railway",
  connectionLimit: 10,
});
const query = (sql, params) => {
  return new Promise((resolve, reject) => {
    pool.query(sql, params, (error, results) => {
      if (error) {
        reject(error);
      } else {
        resolve(results);
      }
    });
  });
};
const checkAuth = (req, res, next) => {
  const teacher = JSON.parse(localStorage.getItem("@teacher")); // แปลงสตริง JSON เป็นออบเจ็กต์
  if (teacher) {
    req.teacher = teacher; // ตั้งค่าข้อมูลครูในออบเจ็กต์ request
    next();
  } else {
    res.status(401).send("Unauthorized");
  }
};
const checkStudent = (req, res, next) => {
  const student = JSON.parse(localStorage.getItem("@student")); // แปลงสตริง JSON เป็นออบเจ็กต์
  if (student) {
    req.student = student; 
    next();
  } else {
    res.status(401).send("Unauthorized");
  }
};
const checkRole = (role) => {
  return (req, res, next) => { // add res as the second argument
    const teacher = JSON.parse(localStorage.getItem("@teacher")); // รับข้อมูลครูจาก localStorage และแปลงเป็นออบเจ็กต์
    if (teacher.role === role) {
      next(); // ส่งค่า next ถ้าบทบาทตรงกัน
    } else {
      res.status(403).send("Forbidden"); // ส่งค่า res.status(403).send("Forbidden") ถ้าบทบาทไม่ตรงกัน
    }
  };
};
app.post("/teacher_login", async (req, res) => {
  try {
    const { email, password } = req.body;
    // ตรวจสอบข้อมูลนำเข้า
    if (!email || !password) {
      return res.status(400).send("Invalid input");
    }
    const teacher = await query("SELECT * FROM teacher WHERE email = ?", [
      email,
    ]);
    if (teacher.length === 0) {
      return res.status(404).send("User not found");
    }
    console.log(password, teacher[0].password);
    const match = password == teacher[0].password;
    if (!match) {
      return res.status(401).send("Wrong password");
    }
    const role = await query(
      "SELECT role_name FROM teacher_role WHERE role_id = ?",
      [teacher[0].role_id]
    );
    if (role.length === 0) {
      return res.status(500).send("Role not found");
    }
    const teacherInfo = {
      id: teacher[0].teacher_id,
      firstName: teacher[0].first_name,
      lastName: teacher[0].last_name,
      email: teacher[0].email,
      role: role[0].role_name, // รวมข้อมูลบทบาทที่นี่
    };
    localStorage.setItem("@teacher", JSON.stringify(teacherInfo)); // แปลงออบเจ็กต์เป็นสตริงและเก็บใน localStorage
    res.json(teacherInfo); // ส่งข้อมูลครูเป็น JSON response
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});
app.post("/logout", checkAuth, (req, res) => {
  localStorage.removeItem("@teacher"); // ลบข้อมูลครูออกจาก localStorage
  res.send("Logged out");
});
app.post("/logout-student", checkStudent, (req, res) => {
  localStorage.removeItem("@student"); // ลบข้อมูลครูออกจาก localStorage
  res.send("Logged out");
});
app.get("/teacher", checkAuth, (req, res) => {
  res.json(req.teacher); // Send the teacher information from the request object
});
app.get("/teacher", checkAuth, checkRole("ADMIN"), async (req, res) => {
  try {
    const teachers = await query(
      "SELECT t.*, r.role_name FROM teacher t JOIN teacher_role r ON t.role_id = r.role_id"
    );
    res.json(teachers);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});
app.get("/teachers/:id", checkAuth, async (req, res) => {
  try {
    const { id } = req.params;
    if (isNaN(id)) {
      return res.status(400).send("Invalid id");
    }
    if (
      req.teacher.id !== parseInt(id) &&
      req.teacher.role !== "ADMIN"
    ) {
      return res.status(403).send("Forbidden");
    }
    const teacher = await query(
      "SELECT t.*, r.role_name FROM teacher t JOIN teacher_role r ON t.role_id = r.role_id WHERE t.teacher_id = ?",
      [id]
    );
    if (teacher.length === 0) {
      return res.status(404).send("User not found");
    }
    res.json(teacher[0]);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
})
app.post("/student_login", async (req, res) => {
  try {
    const { student_id, card_code } = req.body;
    // Validate the input
    if (!student_id || !card_code) {
      return res.status(400).send("Invalid input");
    }
    const student = await query("SELECT * FROM student WHERE student_id = ?", [
      student_id,
    ]);
    if (student.length === 0) {
      return res.status(404).send("student not found");
    }
    console.log(card_code, student[0].card_code);
    const match = card_code == student[0].card_code;
    if (!match) {
      return res.status(401).send("Wrong password");
    }
    const schoolClass = await query(
      "SELECT class_id,class_name FROM classes WHERE class_id = ?",[student[0].class_id]
    );
    if (schoolClass.length === 0) {
      return res.status(500).send("schoolClass not found");
    }
    const room = await query(
      "SELECT room_name FROM rooms WHERE room_id = ?",[student[0].room_id]
    );
    if (room.length === 0) {
      return res.status(500).send("room not found");
    }
    const studentInfo = {
      id: student[0].student_id,
      firstName: student[0].first_name,
      lastName: student[0].last_name,
      email: student[0].email,
      phoneNumber: student[0].phone_number,
      schoolClass: schoolClass[0].class_name,
      class_id: schoolClass[0].class_id,
      room: room[0].room_name
      // Include role information here
    };
    localStorage.setItem("@student", JSON.stringify(studentInfo)); // แปลงออบเจ็กต์เป็นสตริงและเก็บใน localStorage
    res.json(studentInfo); // ส่งข้อมูลครูเป็น JSON response

  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});
app.get("/count_students",checkAuth,checkRole("ADMIN"), async (req, res) => {
  try {
    const countStudents = await query(
      "SELECT c.class_name, COUNT(s.student_id) AS student_count FROM student s JOIN classes c ON s.class_id = c.class_id GROUP BY c.class_name"
    );
    res.json(countStudents);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});
/* Get All students */
app.get("/all_students", checkAuth, checkRole("ADMIN"), async (req, res) => {
  try {
    const all_students = await query(
      "SELECT * FROM student s JOIN classes c ON s.class_id = c.class_id JOIN rooms r ON s.room_id = r.room_id ORDER BY c.class_id asc,r.room_id asc "
    );
    res.json(all_students);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});

/* Add student */
app.post("/add_student",checkAuth,checkRole("ADMIN"), async (req, res) => {
  try {
    // get the data from the request body
    const { student_id, card_code, first_name, last_name, phone_number, email, class_id, room_id } = req.body;

    // validate the data
    if (!student_id || !card_code) {
      return res.status(400).send("Please provide all the required fields");
    }

    // insert the data into the database
    await query(
      "INSERT INTO student (student_id, card_code, first_name, last_name, phone_number, email, class_id, room_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [student_id, card_code, first_name, last_name, phone_number, email, class_id, room_id]
    );

    // send a success message
    res.send("เพิ่มนักเรียนสำเร็จ");
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});
app.get("/class_list", checkAuth, async (req, res) => {
  try {
    const classList = await query(
      "SELECT class_id, class_name FROM classes ORDER BY class_id ASC"
    );
    res.json(classList);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});

app.get("/room_list", checkAuth, async (req, res) => {
  try {
    const roomList = await query(
      "SELECT room_id, room_name FROM rooms ORDER BY room_id ASC"
    );
    res.json(roomList);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});

app.post("/upload_excel", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send("No file uploaded");
    }

    // Read the uploaded file
    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0]; // Read the first sheet
    const worksheet = workbook.Sheets[sheetName];

    // Log worksheet data for debugging
    console.log("Worksheet data:", worksheet);

    // Parse the Excel data, skipping the first row (header)
    const students = XLSX.utils.sheet_to_json(worksheet);
    console.log("Parsed students data:", students); // Log parsed data

    // Check if there is any data
    if (students.length === 0) {
      return res.status(400).send("ไฟล์ Excel ไม่มีข้อมูล");
    }

    // Map data to match database columns
    const mappedStudents = students.map((row) => ({
      student_id: row["รหัสนักเรียน"],
      card_code: row["เลขประจำตัวประชาชน"],
      first_name: row["ชื่อ"],
      last_name: row["นามสกุล"],
      phone_number: row["เบอร์โทร"],
      email: row["อีเมล"],
      class_id: row["ชั้นเรียน"],
      room_id: row["ห้อง"],
    }));

    console.log("Mapped students data:", mappedStudents); // Log mapped data

    // Insert data into the database
    for (const student of mappedStudents) {
      await query(
        "INSERT INTO student (student_id, card_code, first_name, last_name, phone_number, email, class_id, room_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [
          student.student_id,
          student.card_code,
          student.first_name,
          student.last_name,
          student.phone_number,
          student.email,
          student.class_id,
          student.room_id,
        ]
      );
    }

    res.send("Data imported successfully");
  } catch (error) {
    console.error("Error details:", error);
    res.status(500).send("Server error");
  }
});

app.delete("/delete_students", async (req, res) => {
  try {
    const { studentIds } = req.body;
    // ทำการลบข้อมูลนักเรียนที่มีรหัสที่ถูกส่งมา
    await query("DELETE FROM student WHERE student_id IN (?)", [studentIds]);
    res.send("Deleted successfully");
  } catch (error) {
    console.error("Error deleting students:", error);
    res.status(500).send("Server error");
  }
});
app.delete("/delete_student/:student_id", checkAuth, checkRole("ADMIN"), async (req, res) => {
  try {
    const { student_id } = req.params;

    // ตรวจสอบว่านักเรียนที่ต้องการลบมีอยู่จริงหรือไม่
    const student = await query("SELECT * FROM student WHERE student_id = ?", [student_id]);
    if (student.length === 0) {
      return res.status(404).send("Student not found");
    }

    // ลบนักเรียนออกจากฐานข้อมูล
    await query("DELETE FROM student WHERE student_id = ?", [student_id]);

    // ส่งข้อความแจ้งเตือนว่าการลบนักเรียนสำเร็จ
    res.send("Student deleted successfully");
  } catch (error) {
    console.error("Error deleting student:", error);
    res.status(500).send("Server error");
  }
});
app.put("/update_student/:student_id", checkAuth, checkRole("ADMIN"), async (req, res) => {
  try {
    const { card_code, first_name, last_name, phone_number, email, class_id, room_id } = req.body;
    const { student_id } = req.params; // เปลี่ยนจาก req.body เป็น req.params

    // Update student information in the database
    await query(
      "UPDATE student SET card_code = ?, first_name = ?, last_name = ?, phone_number = ?, email = ?, class_id = ?, room_id = ? WHERE student_id = ?",
      [card_code, first_name, last_name, phone_number, email, class_id, room_id, student_id]
    );

    res.send("Student information updated successfully");
  } catch (error) {
    console.error("Error updating student:", error);
    res.status(500).send("Server error");
  }
});
/* Add teacher */
app.post("/add_teacher", checkAuth, checkRole("ADMIN"), async (req, res) => {
  try {
    // get the data from the request body
    const { email, password, phone_number, first_name, last_name, role_id } = req.body;

    // validate the data
    if (!email || !password) {
      return res.status(400).send("Please provide email and password");
    }

    // insert the data into the database
    await query(
      "INSERT INTO teacher (email, password, phone_number ,first_name, last_name, role_id) VALUES (?, ?, ?, ?, ?, ?)",
      [email, password, phone_number, first_name, last_name, role_id]
    );

    // send a success message
    res.send("Teacher added successfully");
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});


/* Get All teachers */
app.get("/all_teachers", checkAuth, checkRole("ADMIN"), async (req, res) => {
  try {
    const allTeachers = await query(
      "SELECT * FROM teacher JOIN teacher_role ON teacher.role_id = teacher_role.role_id"
    );
    res.json(allTeachers);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});

/* Delete teacher */
app.delete("/delete_teacher/:teacher_id", checkAuth, checkRole("ADMIN"), async (req, res) => {
  try {
    const { teacher_id } = req.params;

    // delete teacher from the database
    await query("DELETE FROM teacher WHERE teacher_id = ?", [teacher_id]);

    res.send("Teacher deleted successfully");
  } catch (error) {
    console.error("Error deleting teacher:", error);
    res.status(500).send("Server error");
  }
});
app.delete("/delete_teachers", checkAuth, checkRole("ADMIN"), async (req, res) => {
  try {
    const { teacherIds } = req.body;

    // ลบครูจากฐานข้อมูลตามรายการที่ระบุ
    await Promise.all(teacherIds.map(async (teacherId) => {
      await query("DELETE FROM teacher WHERE teacher_id = ?", [teacherId]);
    }));

    res.send("Teachers deleted successfully");
  } catch (error) {
    console.error("Error deleting teachers:", error);
    res.status(500).send("Server error");
  }
});


app.put("/update_teacher/:teacher_id", checkAuth, checkRole("ADMIN"), async (req, res) => {
  try {
    const { email, password, first_name, last_name,phone_number, role_id } = req.body;
    const { teacher_id } = req.params;

    // Update teacher information in the database
    await query(
      "UPDATE teacher SET email = ?, password = ?, first_name = ?, last_name = ?, phone_number = ?, role_id = ? WHERE teacher_id = ?",
      [email, password, first_name, last_name, phone_number, role_id, teacher_id]
    );

    res.send("Teacher information updated successfully");
  } catch (error) {
    console.error("Error updating teacher:", error);
    res.status(500).send("Server error");
  }
});




app.post("/add_teachers_excel", checkAuth, checkRole("ADMIN"), upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send("No file uploaded");
    }

    // Read the uploaded file
    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0]; // Read the first sheet
    const worksheet = workbook.Sheets[sheetName];

    // Log worksheet data for debugging
    console.log("Worksheet data:", worksheet);

    // Parse the Excel data, skipping the first row (header)
    const teachers = XLSX.utils.sheet_to_json(worksheet);
    console.log("Parsed teachers data:", teachers); // Log parsed data

    // Check if there is any data
    if (teachers.length === 0) {
      return res.status(400).send("ไฟล์ Excel ไม่มีข้อมูล");
    }

    // Map data to match database columns
    const mappedTeachers = teachers.map((row) => ({
      email: row["อีเมล"],
      password: row["รหัสผ่าน"],
      phone_number: row["เบอร์โทร"],
      first_name: row["ชื่อ"],
      last_name: row["นามสกุล"],
      role_id: row["รหัสบทบาท"],
    }));

    console.log("Mapped teachers data:", mappedTeachers); // Log mapped data

    // Insert data into the database
    for (const teacher of mappedTeachers) {
      await query(
        "INSERT INTO teacher (email, password, phone_number, first_name, last_name, role_id) VALUES (?, ?, ?, ?, ?, ?)",
        [
          teacher.email,
          teacher.password,
          teacher.phone_number,
          teacher.first_name,
          teacher.last_name,
          teacher.role_id,
        ]
      );
    }

    res.send("Teachers imported successfully");
  } catch (error) {
    console.error("Error details:", error);
    res.status(500).send("Server error");
  }
});

// Express.js

app.get("/role_list", checkAuth, checkRole("ADMIN"), async (req, res) => {
  try {
    const roles = await query("SELECT * FROM teacher_role"); // ดึงข้อมูลบทบาททั้งหมดจากฐานข้อมูล
    res.json(roles); // ส่งข้อมูลบทบาทกลับเป็น JSON response
  } catch (error) {
    console.error('Error fetching role list:', error);
    res.status(500).send("Server error");
  }
});

app.get("/all_clubs", checkAuth, async (req, res) => {
  try {
    const allClubs = await query(
      "SELECT cd.*,c.*, cl.*,t.teacher_id, t.first_name,t.last_name,t.email,t.phone_number FROM club_data cd JOIN club c ON cd.club_id = c.club_id JOIN teacher t ON cd.teacher_id = t.teacher_id JOIN classes cl ON cd.class_id = cl.class_id "
    );
    res.json(allClubs);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});
app.get("/all_clubs_student", async (req, res) => {
  try {
    const allClubsStudent = await query(
      "SELECT cd.*,c.*, cl.*,t.teacher_id, t.first_name,t.last_name,t.email,t.phone_number FROM club_data cd JOIN club c ON cd.club_id = c.club_id JOIN teacher t ON cd.teacher_id = t.teacher_id JOIN classes cl ON cd.class_id = cl.class_id "
    );
    res.json(allClubsStudent);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});
app.get("/all_clubs_teacher/:teacher_id", checkAuth, async (req, res) => {
  try {
    const teacherId = req.params.teacher_id;
    const allClubs = await query(
      "SELECT cd.*, c.*, cl.*, t.teacher_id, t.first_name, t.last_name, t.email, t.phone_number FROM club_data cd JOIN club c ON cd.club_id = c.club_id JOIN teacher t ON cd.teacher_id = t.teacher_id JOIN classes cl ON cd.class_id = cl.class_id WHERE t.teacher_id = ?",
      [teacherId]
    );
    res.json(allClubs);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});

app.delete("/delete_clubs", checkAuth, checkRole("ADMIN"), async (req, res) => {
  try {
    const { clubIds } = req.body;

    // Delete associated records in club_data table
    await Promise.all(clubIds.map(async (clubId) => {
      await query("DELETE FROM club_data WHERE club_id = ?", [clubId]);
    }));

    // Delete associated records in choose_club table
    await Promise.all(clubIds.map(async (clubId) => {
      await query("DELETE FROM choose_club WHERE club_id = ?", [clubId]);
    }));

    // Now delete clubs
    await Promise.all(clubIds.map(async (clubId) => {
      await query("DELETE FROM club WHERE club_id = ?", [clubId]);
    }));

    res.send("Clubs deleted successfully");
  } catch (error) {
    console.error("Error deleting clubs:", error);
    res.status(500).send("Server error");
  }
});


app.delete("/delete_club/:club_id", checkAuth, async (req, res) => {
  try {
    const clubId = req.params.club_id; // Retrieve club_id from route parameter

    // Delete associated records in choose_club table
    await query("DELETE FROM choose_club WHERE club_id = ?", [clubId]);

    // Delete associated records in club_data table
    await query("DELETE FROM club_data WHERE club_id = ?", [clubId]);

    // Now delete club
    await query("DELETE FROM club WHERE club_id = ?", [clubId]);

    res.send("Club deleted successfully");
  } catch (error) {
    console.error("Error deleting club:", error);
    res.status(500).send("Server error");
  }
});

// Create a new club
app.post("/create_club", checkAuth, async (req, res) => {
  try {
    const { club_name, open_to_receive,description, number_of_member, teacher_id, class_id } = req.body; // Retrieve club data from request body

    await query("START TRANSACTION");
    const clubResult = await query("INSERT INTO club (club_name, open_to_receive,description) VALUES (?, ?, ?)", [club_name, open_to_receive,description]);
    const clubId = clubResult.insertId;

    for (const classId of class_id) {
      for (const teacherId of teacher_id) {
        await query("INSERT INTO club_data (club_id, teacher_id, class_id) VALUES (?, ?, ?)", [clubId, teacherId, classId]);
      }
    }

    await query("COMMIT");

    res.status(201).json({ id: clubId, club_name, open_to_receive }); // Respond with the newly created club's ID
  } catch (error) {
    console.error("Error creating club:", error);
    await query("ROLLBACK");
    res.status(500).send("Server error");
  }
});
app.put("/edit_club/:club_id", checkAuth, async (req, res) => {
  try {
    const { club_name, open_to_receive, description, teacher_id, class_id } = req.body;
    const { club_id } = req.params;

    // อัปเดตข้อมูลในตาราง club
    await query(
      "UPDATE club SET club_name = ?, open_to_receive = ?, description = ? WHERE club_id = ?",
      [club_name, open_to_receive, description, club_id]
    );

    // ดึงข้อมูล club_data ที่เกี่ยวข้องกับ club_id ที่ต้องการอัปเดต
    const existingClubData = await query("SELECT * FROM club_data WHERE club_id = ?", [club_id]);

    // วนลูปเพื่อตรวจสอบข้อมูลที่ส่งมาจาก Multi select
    for (const classId of class_id) {
      for (const teacherId of teacher_id) {
        // ตรวจสอบว่าข้อมูลที่ส่งมาใหม่นี้มีอยู่ใน club_data หรือไม่
        const exists = existingClubData.some(data => data.class_id === classId && data.teacher_id === teacherId);
        if (!exists) {
          // ถ้าไม่มีให้เพิ่มข้อมูลใหม่เข้าไปใน club_data
          await query("INSERT INTO club_data (club_id, teacher_id, class_id) VALUES (?, ?, ?)", [club_id, teacherId, classId]);
        }
      }
    }

    // วนลูปเพื่อตรวจสอบข้อมูลที่ไม่ได้เลือกใน Multi select เพื่อทำการลบ
    for (const data of existingClubData) {
      const existsInNewSelection = class_id.includes(data.class_id) && teacher_id.includes(data.teacher_id);
      if (!existsInNewSelection) {
        // ถ้าไม่มีอยู่ในข้อมูลที่ส่งมาใหม่ให้ทำการลบ
        await query("DELETE FROM club_data WHERE club_id = ? AND teacher_id = ? AND class_id = ?", [club_id, data.teacher_id, data.class_id]);
      }
    }

    res.status(200).json({ message: "Club updated successfully" });
  } catch (error) {
    console.error("Error updating club:", error);
    res.status(500).send("Server error");
  }
});








app.post("/update_time_open/:time_open_id", checkAuth, checkRole("ADMIN"), async (req, res) => {
  try {
    const { date_of_open, time_open } = req.body;
    const { time_open_id } = req.params;

    // ตรวจสอบว่าข้อมูลถูกส่งมาครบถ้วน
    if (!date_of_open || !time_open || !time_open_id) {
      return res.status(400).send("Please provide date of open, time of open, and time open ID");
    }

    // อัปเดตข้อมูลในฐานข้อมูล
    await query(
      "UPDATE time_open SET date_of_open = ?, time_open = ? WHERE time_open_id = ?",
      [date_of_open, time_open, time_open_id]
    );

    res.send("Time open updated successfully");
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});

app.post("/update_end_time_open/:end_time_open_id", checkAuth, checkRole("ADMIN"), async (req, res) => {
  try {
    const { date_end, time_end } = req.body;
    const { end_time_open_id } = req.params;

    // ตรวจสอบว่าข้อมูลถูกส่งมาครบถ้วน
    if (!date_end || !time_end || !end_time_open_id) {
      return res.status(400).send("Please provide date end, time end, and end time open ID");
    }

    // อัปเดตข้อมูลในฐานข้อมูล
    await query(
      "UPDATE end_time_open SET date_end = ?, time_end = ? WHERE end_time_open_id = ?",
      [date_end, time_end, end_time_open_id]
    );

    res.send("End time open updated successfully");
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});

app.get("/get_end_time_open", async (req, res) => {
  try {
    const result = await query("SELECT * FROM end_time_open");
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});



app.get("/get_time_open", async (req, res) => {
  try {
    const result = await query("SELECT * FROM time_open");
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});

app.get("/teacher_list", checkAuth, async (req, res) => {
  try {
    const teacherList = await query(
      "SELECT teacher_id, first_name, last_name FROM teacher ORDER BY teacher_id ASC"
    );
    res.json(teacherList);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});

app.get("/count_students_club", async (req, res) => {
  try {
    const count_students_club = await query(
      "SELECT club_id, COUNT(student_id) AS student_count FROM choose_club GROUP BY club_id"
    );
    res.json(count_students_club);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});
app.get("/student_club/:clubId", checkAuth, async (req, res) => {
  const { clubId } = req.params;
  try {
    const student_club = await query(
      "SELECT ch.*, s.*, c.*, cl.*, r.* FROM choose_club ch JOIN student s ON ch.student_id = s.student_id JOIN club c ON ch.club_id = c.club_id JOIN classes cl ON s.class_id = cl.class_id JOIN rooms r ON r.room_id = s.room_id WHERE c.club_id = ?",
      [clubId]
    );
    res.json(student_club);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});

app.delete("/delete_students_club/:studentId", checkAuth, async (req, res) => {
  try {
    const { studentId } = req.params; // รับพารามิเตอร์ studentId ผ่าน URL parameter
    await query("DELETE FROM choose_club WHERE student_id = ?", [studentId]); // ใช้ studentId ในการลบข้อมูล
    res.send("Deleted successfully");
  } catch (error) {
    console.error("Error deleting student:", error);
    res.status(500).send("Server error");
  }
});


app.post("/student_choose", checkStudent, async (req, res) => {
  try {
    // get the data from the request body
    const { student_id, club_id } = req.body;

    // Check if the club is still open for receiving more students
    const clubInfo = await query(
      "SELECT open_to_receive FROM club WHERE club_id = ?",
      [club_id]
    );

    if (clubInfo.length === 0) {
      return res.status(404).send("Club not found");
    }

    const { open_to_receive } = clubInfo[0];

    // Count the number of students who have chosen the club
    const countStudentsClub = await query(
      "SELECT COUNT(*) AS student_count FROM choose_club WHERE club_id = ?",
      [club_id]
    );

    const { student_count } = countStudentsClub[0];

    // Check if the club can receive more students
    if (student_count >= open_to_receive) {
      return res.status(400).send("Club has reached maximum capacity");
    }

    // Insert the student's choice into the database
    await query(
      "INSERT INTO choose_club (student_id, club_id) VALUES (?, ?)",
      [student_id, club_id]
    );

    // send a success message
    res.send("เลือกชุมนุมสำเร็จ");
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});
app.get("/student_already_chosen/:student_id", async (req, res) => {
  try {
    const studentId = req.params.student_id;

    // Check if the student has already chosen a club
    const alreadyChosen = await query(
      "SELECT EXISTS (SELECT 1 FROM choose_club WHERE student_id = ?) AS alreadyChosen",
      [studentId]
    );

    res.json(alreadyChosen[0]);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});
app.get("/clubs_for_student/:student_id", checkStudent, async (req, res) => {
  try {
    const studentId = req.params.student_id;
    const clubsForStudent = await query(
      "SELECT c.* , s.* , cl.* FROM choose_club c JOIN student s ON c.student_id = s.student_id JOIN club cl ON c.club_id = cl.club_id WHERE c.student_id = ?",
      [studentId]
    );
    res.json(clubsForStudent);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});

app.delete("/clubs_for_student/:student_id", checkStudent, async (req, res) => {
  try {
    const studentId = req.params.student_id;
    const clubsDeleted = await query(
      "DELETE FROM choose_club WHERE student_id = ?",
      [studentId]
    );
    res.json({ message: `Deleted ${clubsDeleted.affectedRows} club(s) for student with ID ${studentId}` });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});
app.get("/combined_time_data", async (req, res) => {
  try {
    // Fetch data from time_open table
    const timeOpenData = await query("SELECT date_of_open, time_open FROM time_open");

    // Fetch data from end_time_open table
    const endTimeOpenData = await query("SELECT date_end, time_end FROM end_time_open");

    // Combine the data as needed
    const combinedData = {
      timeOpenData: timeOpenData,
      endTimeOpenData: endTimeOpenData
    };

    // Send the combined data as response
    res.json(combinedData);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});



app.listen(4000, () => {
  console.log("Server listening on port 4000");
});