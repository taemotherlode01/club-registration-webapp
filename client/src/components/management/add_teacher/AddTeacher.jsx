import React, { useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';
import axios from 'axios';

function AddTeacher({ onClose }) {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone_number: '',
    email: '',
    password: '',
    role_id: ''
  });

  const [roleList, setRoleList] = useState([]);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    fetchRole();
  }, []);

  const fetchRole = async () => {
    try {
      const response = await axios.get('http://localhost:4000/role_list'); // แก้ URL ให้เป็น '/role_list'
      setRoleList(response.data);
    } catch (error) {
      console.error('Error fetching role list:', error);
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
      const response = await axios.post('http://localhost:4000/add_teacher', formData);
      setSuccessMessage(response.data);
      setErrorMessage("");
      setFormData({
        first_name: '',
        last_name: '',
        phone_number: '',
        email: '',
        role_id: '',
        password: ''
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
            <h5 className="modal-title">เพิ่มครู</h5>
            <button type="button" className="btn-close" aria-label="Close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <form onSubmit={handleSubmit}>
              <div className="row">
                <div className="col-md-6">
                  <div className="mb-3">
                    <label htmlFor="first_name" className="form-label">ชื่อ</label>
                    <input type="text" className="form-control" id="first_name" name="first_name" value={formData.first_name} onChange={handleChange} />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="last_name" className="form-label">นามสกุล</label>
                    <input type="text" className="form-control" id="last_name" name="last_name" value={formData.last_name} onChange={handleChange} />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="phone_number" className="form-label">เบอร์โทร</label>
                    <input type="text" className="form-control" id="phone_number" name="phone_number" value={formData.phone_number} onChange={handleChange} />
                  </div>
                </div>
                
                <div className="col-md-6">
                  <div className="mb-3">
                    <label htmlFor="email" className="form-label">อีเมล</label>
                    <input type="email" className="form-control" id="email" name="email" value={formData.email} onChange={handleChange} />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="password" className="form-label">รหัสผ่าน</label>
                    <input type="password" className="form-control" id="password" name="password" value={formData.password} onChange={handleChange} />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="subject_id" className="form-label">สิทธิ</label>
                    <select className="form-control" id="role_id" name="role_id" value={formData.role_id} onChange={handleChange} required>
                      <option value="">เลือกสิทธิ</option>
                      {roleList.map((roleItem) => (
                        <option key={roleItem.role_id} value={roleItem.role_id}>{roleItem.role_name}</option>
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

export default AddTeacher;
