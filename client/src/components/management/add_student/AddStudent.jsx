import React, { useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';
import axios from 'axios';

function AddStudent({ onClose }) {
  const [formData, setFormData] = useState({
    student_id: '',
    card_code: '',
    first_name: '',
    last_name: '',
    phone_number: '',
    email: '',
    class_id: '',
    room_id: ''
  });

  const [classList, setClassList] = useState([]);
  const [roomList, setRoomList] = useState([]);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    fetchClassList();
    fetchRoomList();
  }, []);

  const fetchClassList = async () => {
    try {
      const response = await axios.get('http://localhost:4000/class_list');
      setClassList(response.data);
    } catch (error) {
      console.error('Error fetching class list:', error);
    }
  };

  const fetchRoomList = async () => {
    try {
      const response = await axios.get('http://localhost:4000/room_list');
      setRoomList(response.data);
    } catch (error) {
      console.error('Error fetching room list:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:4000/add_student', formData);
      setSuccessMessage(response.data);
      setErrorMessage("");
      setFormData({
        student_id: '',
        card_code: '',
        first_name: '',
        last_name: '',
        phone_number: '',
        email: '',
        class_id: '',
        room_id: ''
      });
    } catch (error) {
      if (error.response && error.response.data) {
        setErrorMessage(error.response.data);
      } else {
        setErrorMessage("An unexpected error occurred.");
      }
      setSuccessMessage("");
    }
  };

  return (
    <div className="modal" tabIndex="-1" role="dialog" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog" role="document">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">เพิ่มนักเรียน</h5>
            <button type="button" className="btn-close" aria-label="Close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <form onSubmit={handleSubmit}>
              <div className="row">
                <div className="col-md-6">
                  <div className="mb-3">
                    <label htmlFor="student_id" className="form-label">รหัสนักเรียน</label>
                    <input type="text" className="form-control" id="student_id" name="student_id" value={formData.student_id} onChange={handleChange} required />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="card_code" className="form-label">เลขประจำตัวประชาชน</label>
                    <input type="text" className="form-control" id="card_code" name="card_code" value={formData.card_code} onChange={handleChange} required />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="first_name" className="form-label">ชื่อ</label>
                    <input type="text" className="form-control" id="first_name" name="first_name" value={formData.first_name} onChange={handleChange} />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="last_name" className="form-label">นามสกุล</label>
                    <input type="text" className="form-control" id="last_name" name="last_name" value={formData.last_name} onChange={handleChange} />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label htmlFor="phone_number" className="form-label">เบอร์โทร</label>
                    <input type="text" className="form-control" id="phone_number" name="phone_number" value={formData.phone_number} onChange={handleChange} />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="email" className="form-label">อีเมล</label>
                    <input type="email" className="form-control" id="email" name="email" value={formData.email} onChange={handleChange} />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="class_id" className="form-label">ชั้น</label>
                    <select className="form-control" id="class_id" name="class_id" value={formData.class_id} onChange={handleChange} required>
                      <option value="">เลือกชั้น</option>
                      {classList.map((classItem) => (
                        <option key={classItem.class_id} value={classItem.class_id}>{classItem.class_name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label htmlFor="room_id" className="form-label">ห้อง</label>
                    <select className="form-control" id="room_id" name="room_id" value={formData.room_id} onChange={handleChange} required>
                      <option value="">เลือกห้อง</option>
                      {roomList.map((roomItem) => (
                        <option key={roomItem.room_id} value={roomItem.room_id}>{roomItem.room_name}</option>
                      ))}
                    </select>
                  </div>
                </div>
               
              </div>
              <button type="submit" className="btn btn-primary">Save</button>
            </form>
          </div>
          {successMessage && <div className="alert alert-success mx-2">{successMessage}</div>}
          {errorMessage && <div className="alert alert-danger mx-2">{errorMessage}</div>}
        </div>
      </div>
    </div>
  );
}

export default AddStudent;
