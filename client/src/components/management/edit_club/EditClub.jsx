import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import 'bootstrap/dist/css/bootstrap.min.css';

function EditClub({ club, updateClubs, onCancel }) {
  const [formData, setFormData] = useState({
    club_name: club.club_name,
    open_to_receive: club.classes[0].open_to_receive,
    end_date_of_receive: club.classes[0].end_date_of_receive.substring(0, club.classes[0].end_date_of_receive.indexOf('T')),
    teacher_id: club.teachers.map(teacher => teacher.teacher_id),
    class_id: club.classes.length > 0 ? club.classes.map(cls => cls.class_id) : []
  });
  
  
  console.log(formData.class_id);
  const [classList, setClassList] = useState([]);
  const [teacherList, setTeacherList] = useState([]);

  useEffect(() => {
    fetchClassList();
    fetchTeacherList();
  }, []);

  const fetchClassList = async () => {
    try {
      const response = await fetch('http://localhost:4000/class_list');
      if (response.ok) {
        const data = await response.json();
        const options = data.map(classItem => ({
          value: classItem.class_id,
          label: classItem.class_name
        }));
        setClassList(options);
      } else {
        console.error('Failed to fetch class list:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching class list:', error);
    }
  };

  const fetchTeacherList = async () => {
    try {
      const response = await fetch('http://localhost:4000/teacher_list');
      if (response.ok) {
        const data = await response.json();
        const options = data.map(teacher => ({
          value: teacher.teacher_id,
          label: `${teacher.first_name} ${teacher.last_name}`
        }));
        setTeacherList(options);
      } else {
        console.error('Failed to fetch teacher list:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching teacher list:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  const handleSelectChange = (selectedOptions) => {
    const selectedValues = selectedOptions.map(option => option.value);
    setFormData(prevData => ({
      ...prevData,
      class_id: selectedValues
    }));
  };

  const handleSelectChangeTeacher = (selectedOptions) => {
    const selectedValues = selectedOptions ? selectedOptions.map(option => option.value) : [];
    setFormData(prevData => ({
      ...prevData,
      teacher_id: selectedValues
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`http://localhost:4000/edit_club/${club.club_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer yourAuthToken' // Add your authentication token here if needed
        },
        body: JSON.stringify({
          club_name: formData.club_name,
          open_to_receive: formData.open_to_receive,
          end_date_of_receive: formData.end_date_of_receive,
          teacher_id: formData.teacher_id,
          class_id: formData.class_id
        })
      });
      if (response.ok) {
        console.log('Club updated successfully');
        updateClubs(); // เรียกใช้งานฟังก์ชัน updateClubs() เพื่ออัปเดตข้อมูลทันที
      }
    } catch (error) {
      console.error('Error updating club:', error);
    }
  };
  
  
  
  return (
    <div className="container px-5">
      <h2>แก้ไขชุมนุม</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>ชื่อชุมนุม</label>
          <input type="text" className="form-control" name="club_name" value={formData.club_name} onChange={handleInputChange} required />
        </div>
        <div className="form-group mt-2">
          <label>จำนวนที่รับ</label>
          <input type="number" className="form-control" name="open_to_receive" value={formData.open_to_receive} onChange={handleInputChange} required />
        </div>
        <div className="form-group mt-2">
          <label>วันที่ปิดรับ</label>
          <input type="date" className="form-control" name="end_date_of_receive" value={formData.end_date_of_receive} onChange={handleInputChange} required />
        </div>
        <div className="form-group mt-2">
          <label>เลือกครูที่ปรึกษาชุมนุม</label>
          <Select
            options={teacherList}
            isMulti
            onChange={handleSelectChangeTeacher}
            value={teacherList.filter(option => formData.teacher_id.includes(option.value))}
          />
        </div>
        <div className="form-group mt-2">
          <label>ชั้นที่เลือกได้</label>
          <Select
            options={classList}
            isMulti
            onChange={handleSelectChange}
            value={classList.filter(option => formData.class_id.includes(option.value))}
          />
        </div>
        <div className="d-flex justify-content-start mt-3 my-4">
          <button type="submit" className="btn btn-primary">บันทึกการแก้ไข</button>
          <button type="button" className="btn btn-secondary mx-2 " onClick={onCancel}>ยกเลิก</button>
        </div>
      </form>
    </div>
  );
}

export default EditClub;
