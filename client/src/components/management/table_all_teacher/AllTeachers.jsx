import React, { useState, useEffect } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import { FaEdit, FaTrash } from 'react-icons/fa';
import './AllTeacher.css';
import AddTeacher from '../add_teacher/AddTeacher';
import EditTeacher from '../edit_teacher/EditTeacher';

function AllTeachers() {
  const [teachers, setTeachers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [file, setFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [selectAll, setSelectAll] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [showEditTeacher, setShowEditTeacher] = useState(false);
  const [selectedTeacherData, setSelectedTeacherData] = useState(null);
  const [sortBy, setSortBy] = useState('');
  const [showAddTeacher, setShowAddTeacher] = useState(false);
  const [isModalClosed, setIsModalClosed] = useState(true);

  useEffect(() => {
    fetchData();
  }, [searchTerm]);

  const fetchData = async () => {
    try {
      const response = await axios.get('http://localhost:4000/all_teachers');
      setTeachers(response.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const filteredTeachers = teachers.filter((teacher) => {
    const fullName = `${teacher.first_name} ${teacher.last_name}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase());
  });

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleUpload = async () => {
    try {
      const formData = new FormData();
      formData.append("file", file);
  
      await axios.post("http://localhost:4000/add_teachers_excel", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
  
      setUploadStatus('อัปโหลดสำเร็จ');
      fetchData();
    } catch (error) {
      console.error("Error uploading file:", error);
      setUploadStatus('อัปโหลดไม่สำเร็จ');
    }
  };

  useEffect(() => {
    if (uploadStatus) {
      setTimeout(() => setUploadStatus(''), 3000);
    }
  }, [uploadStatus]);

  const handleEditTeacher = (teacher) => {
    setSelectedTeacherData(teacher);
    setShowEditTeacher(true);
  };
  

  const handleCloseEditTeacher = () => {
    setShowEditTeacher(false);
    // Call fetchData to refresh data when closing the edit modal
    fetchData();
  };
  
  const handleAddTeacher = () => {
    setShowAddTeacher(true);
    setIsModalClosed(false); // เพิ่มบรรทัดนี้
  };
  
  useEffect(() => {
    if (isModalClosed) {
      fetchData();
    }
  }, [isModalClosed]);
  

  const handleCloseAddTeacher = () => {
    setShowAddTeacher(false);
    setIsModalClosed(true); // เพิ่มบรรทัดนี้
  };
  

  const handleSelectAll = (e) => {
    const checked = e.target.checked;
    setSelectAll(checked);
    const newSelectedItems = checked ? filteredTeachers.map(teacher => teacher.teacher_id) : [];
    setSelectedItems(newSelectedItems);
  };

  const handleDeleteSelectedItems = () => {
    if (selectedItems.length > 0) {
      deleteTeachers(selectedItems);
    }
  };
  

  const deleteTeachers = async (ids) => {
    try {
      await axios.delete(`http://localhost:4000/delete_teachers`, {
        data: { teacherIds: ids }
      });
      fetchData();
    } catch (error) {
      console.error("Error deleting teachers:", error);
    }
  };

  const handleDeleteTeacher = async (teacherId) => {
    try {
      await axios.delete(`http://localhost:4000/delete_teacher/${teacherId}`);
      fetchData();
    } catch (error) {
      console.error("Error deleting teacher:", error);
    }
  };

  const handleSelectItem = (e, teacherId) => {
    const checked = e.target.checked;
    let newSelectedItems = [...selectedItems];
    if (checked) {
      newSelectedItems.push(teacherId);
    } else {
      newSelectedItems = newSelectedItems.filter(id => id !== teacherId);
    }
    setSelectedItems(newSelectedItems);
    setSelectAll(newSelectedItems.length === filteredTeachers.length);
  };

  const sortedTeachers = sortBy ? [...filteredTeachers].sort(compareValues(sortBy)) : filteredTeachers;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedTeachers.slice(indexOfFirstItem, indexOfLastItem);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="container">
      <div className='d-flex flex-row bd-highlight mb-3'>
        <div className="p-2 bd-highlight">
          <button className='btn btn-success' onClick={handleAddTeacher}>+เพิ่มครู</button>
        </div>
        {showAddTeacher && <AddTeacher onClose={handleCloseAddTeacher} />}
        <div className="p-2 bd-highlight">
          <input type="file" className="form-control" onChange={handleFileChange} />
          {uploadStatus && (
            <div className={`alert ${uploadStatus === 'อัปโหลดสำเร็จ' ? 'alert-success' : 'alert-danger'}`} role="alert">
              {uploadStatus}
            </div>
          )}
        </div>
        <div className="p-2 bd-highlight">
          <button onClick={handleUpload} className='btn btn-primary'>Upload</button>
        </div>
      </div>
      <div className="row mb-3">
        <div className="col">
          <input
            type="text"
            className="form-control smaller-placeholder"
            placeholder="ค้นหาครูด้วยชื่อนามสกุล"
            value={searchTerm} 
            onChange={handleSearchChange}
          />
        </div>
      </div>
      <div className="table-responsive">
        <button className='btn btn-danger' onClick={handleDeleteSelectedItems}>ลบรายการที่เลือก</button>
        <table className="table table-striped">
          <thead>
            <tr>
              <th>
                <input type="checkbox" onChange={handleSelectAll} checked={selectAll} />
              </th>
              <th>ชื่อ</th>
              <th>นามสกุล</th>
              <th>อีเมล</th>
              <th>รหัสผ่าน</th>
              <th>เบอร์โทร</th>
              <th>สิทธิ</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.map((teacher) => (
              <tr key={teacher.teacher_id}>
                <td>
                  <input type="checkbox" onChange={(e) => handleSelectItem(e, teacher.teacher_id)} checked={selectedItems.includes(teacher.teacher_id)} />
                </td>
                <td>{teacher.first_name}</td>
                <td>{teacher.last_name}</td>
                <td>{teacher.email}</td>
                <td>{teacher.password}</td>
                <td>{teacher.phone_number}</td>
                <td>{teacher.role_name}</td>
                <td>
                  <button className="btn btn-primary" onClick={() => handleEditTeacher(teacher)}><FaEdit className="mr-1" /></button>
                  <button className="btn btn-danger" onClick={() => handleDeleteTeacher(teacher.teacher_id)}><FaTrash className="mr-1" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {showEditTeacher && <EditTeacher teacherData={selectedTeacherData} onClose={handleCloseEditTeacher} onRefresh={fetchData} />}
        <ul className="pagination">
          {[...Array(Math.ceil(filteredTeachers.length / itemsPerPage)).keys()].map((number) => (
            <li key={number + 1} className="page-item">
              <button onClick={() => paginate(number + 1)} className="page-link">
                {number + 1}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default AllTeachers;
