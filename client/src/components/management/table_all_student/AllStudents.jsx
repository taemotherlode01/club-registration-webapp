import React, { useState, useEffect } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import { FaEdit, FaTrash } from 'react-icons/fa';
import './AllStudent.css';
import AddStudent from '../add_student/AddStudent';
import EditStudent from '../edit_student/EditStudent';
function AllStudents() {
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [studentIdSearchTerm, setStudentIdSearchTerm] = useState('');
  const [cardCodeSearchTerm, setCardCodeSearchTerm] = useState('');
  const [selectedClassName, setSelectedClassName] = useState('');
  const [selectedRoomName, setSelectedRoomName] = useState('');
  const [showData, setShowData] = useState(false);
  const [isRoomNameDisabled, setIsRoomNameDisabled] = useState(true); // State for disabling room_name dropdown
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [roomNames, setRoomNames] = useState([]);
  const [file, setFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [selectAll, setSelectAll] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [showEditStudent, setShowEditStudent] = useState(false);
  const [selectedStudentData, setSelectedStudentData] = useState(null);

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };
  const handleUpload = async () => {
    try {
      const formData = new FormData();
      formData.append("file", file);
  
      await axios.post("http://localhost:4000/upload_excel", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
  
      // อัปเดทสถานะเมื่ออัปโหลดสำเร็จ
      setUploadStatus('อัปโหลดสำเร็จ');
      // Refresh data after upload
      fetchData();
    } catch (error) {
      console.error("Error uploading file:", error);
      // อัปเดทสถานะเมื่ออัปโหลดไม่สำเร็จ
      setUploadStatus('อัปโหลดไม่สำเร็จ');
    }
  };
  useEffect(() => {
    if (uploadStatus) {
      // เมื่อ uploadStatus มีค่าใหม่ ก็ให้แสดง Alert
      setTimeout(() => setUploadStatus(''), 3000); // 3 วินาทีหลังจากนั้นให้ลบข้อความแจ้งสถานะ
    }
  }, [uploadStatus]);

  useEffect(() => {
    fetchData();
  }, [searchTerm, studentIdSearchTerm, cardCodeSearchTerm, selectedClassName, selectedRoomName, sortBy, showEditStudent]);
  

  const fetchData = async () => {
    try {
      const response = await axios.get('http://localhost:4000/all_students');
      setStudents(response.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };
  

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setShowData(false);
  };

  const handleStudentIdSearchChange = (event) => {
    setStudentIdSearchTerm(event.target.value);
    setShowData(false);
  };

  const handleCardCodeSearchChange = (event) => {
    setCardCodeSearchTerm(event.target.value);
    setShowData(false);
  };

  const handleClassNameChange = (event) => {
    const selectedClassName = event.target.value;
    setSelectedClassName(selectedClassName);
    setSelectedRoomName(''); // Reset selected room
    setIsRoomNameDisabled(selectedClassName === '');
    setShowData(false);

    // Filter and set available room names based on the selected class name
    const filteredStudentsByClassName = students.filter(student => selectedClassName === '' || student.class_name === selectedClassName);
    const uniqueRoomNames = Array.from(new Set(filteredStudentsByClassName.map(student => student.room_name)));
    setRoomNames(uniqueRoomNames);
  };

  const handleRoomNameChange = (event) => {
    setSelectedRoomName(event.target.value);
    setShowData(false);
  };

  const handleSortChange = (sortByColumn) => {
    if (sortBy === sortByColumn) {
      setSortBy(`-${sortByColumn}`);
    } else {
      setSortBy(sortByColumn);
    }
  };

  const handleEditStudent = (student) => {
    setSelectedStudentData(student);
    setShowEditStudent(true);
  };
  

  const handleAddStudent = () => {
    setShowAddStudent(true);
  };

  const handleCloseAddStudent = () => {
    setShowAddStudent(false);
  };

  const handleSelectAll = (e) => {
    const checked = e.target.checked;
    setSelectAll(checked);
    const newSelectedItems = checked ? currentItems.map(item => item.student_id) : [];
    setSelectedItems(newSelectedItems);
  };
  const handleDeleteSelectedItems = () => {
    if (selectedItems.length > 0) { // ตรวจสอบว่ามีรายการที่เลือกหรือไม่
      deleteStudents(selectedItems); // เรียกใช้ฟังก์ชัน deleteStudents เพื่อลบข้อมูล
    }
  };
  const deleteStudents = async (ids) => {
    try {
      // ส่งคำขอลบข้อมูลที่เลือกไปยังเซิร์ฟเวอร์
      await axios.delete(`http://localhost:4000/delete_students`, {
        data: { studentIds: ids }
      });
  
      // หลังจากลบข้อมูลสำเร็จ ให้รีเฟรชข้อมูล
      fetchData();
    } catch (error) {
      console.error("Error deleting students:", error);
    }
  };
  const handleDeleteStudent = async (studentId) => {
    try {
      // ส่งคำขอลบข้อมูลนักเรียนไปยังเซิร์ฟเวอร์
      await axios.delete(`http://localhost:4000/delete_student/${studentId}`);
      // หลังจากที่ลบเสร็จสมบูรณ์แล้ว ให้รีเฟรชข้อมูลนักเรียน
      fetchData();
    } catch (error) {
      console.error("Error deleting student:", error);
    }
  };
  
  
  
  
  const handleSelectItem = (e, studentId) => {
    const checked = e.target.checked;
    let newSelectedItems = [...selectedItems];
    if (checked) {
      newSelectedItems.push(studentId);
    } else {
      newSelectedItems = newSelectedItems.filter(id => id !== studentId);
    }
    setSelectedItems(newSelectedItems);
    setSelectAll(newSelectedItems.length === currentItems.length);
  };
  
  const compareValues = (key) => {
    return function (a, b) {
      if (!a.hasOwnProperty(key) || !b.hasOwnProperty(key)) {
        return 0;
      }

      const varA = typeof a[key] === 'string' ? a[key].toUpperCase() : a[key];
      const varB = typeof b[key] === 'string' ? b[key].toUpperCase() : b[key];

      let comparison = 0;
      if (varA > varB) {
        comparison = 1;
      } else if (varA < varB) {
        comparison = -1;
      }
      return key[0] === '-' ? comparison * -1 : comparison;
    };
  };

  const filteredStudents = students.filter((student) =>
    ['first_name', 'last_name'].some((key) =>
      typeof student[key] === 'string' && (
        student[key].toLowerCase().includes(searchTerm.toLowerCase()) ||
        `${student.first_name.toLowerCase()} ${student.last_name.toLowerCase()}`.includes(searchTerm.toLowerCase())
      )
    )
  ).filter((student) =>
    student.student_id.toString().includes(studentIdSearchTerm) &&
    student.card_code.toString().includes(cardCodeSearchTerm) &&
    (selectedClassName === '' || student.class_name === selectedClassName) &&
    (selectedRoomName === '' || student.room_name === selectedRoomName)
  );

  const sortedStudents = sortBy ? [...filteredStudents].sort(compareValues(sortBy)) : filteredStudents;

  useEffect(() => {
    if (searchTerm || studentIdSearchTerm || cardCodeSearchTerm || selectedClassName || selectedRoomName) {
      setShowData(true);
    }
  }, [searchTerm, studentIdSearchTerm, cardCodeSearchTerm, selectedClassName, selectedRoomName]);

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedStudents.slice(indexOfFirstItem, indexOfLastItem);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="container" style={{ overflowX: "auto" }}>
      
      <div className='d-flex flex-row bd-highlight mb-3'>
      <div className="p-2 bd-highlight">
      <button className='btn btn-success' onClick={handleAddStudent}>+เพิ่มนักเรียน</button>
      </div>
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
      {/* หน้าต่าง Popup เพื่อเพิ่มนักเรียน */}
      {showAddStudent && <AddStudent onClose={handleCloseAddStudent} />}
      <h1>ข้อมูลนักเรียน</h1>
      <div className="row mb-3">
        <h5 style={{ marginTop: "20px" }}>ค้นหาแบบบุคคล</h5>
        <div className="col">
          <input
            type="text"
            className="form-control"
            placeholder="ชื่อ"
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>
        <div className="col">
          <input
            type="text"
            className="form-control"
            placeholder="รหัสนักเรียน"
            value={studentIdSearchTerm}
            onChange={handleStudentIdSearchChange}
          />
        </div>
        <div className="col">
          <input
            type="text"
            className="form-control"
            placeholder="ประจำตัวประชาชน"
            value={cardCodeSearchTerm}
            onChange={handleCardCodeSearchChange}
          />
        </div>
        <h6 style={{ marginTop: "20px" }}>เลือกชั้นเรียน</h6>
        <div className="col">
          <select className="form-select" value={selectedClassName} onChange={handleClassNameChange}>
            <option value="">เลือกชั้นเรียน</option>
            {Array.from(new Set(students.map(student => student.class_name))).map(className => (
              <option key={className} value={className}>{className}</option>
            ))}
          </select>
        </div>
        <div className="col" style={{ marginBottom: "10px" }}>
          <select className="form-select" value={selectedRoomName} onChange={handleRoomNameChange} disabled={isRoomNameDisabled}>
            <option value="">ทุกห้อง</option>
            {roomNames.map(roomName => (
              <option key={roomName} value={roomName}>{roomName}</option>
            ))}
          </select>
        </div>
      </div>
     

      {showData && (
        <div className="table-responsive" style={{ overflowX: "auto" }}>
           <button className='btn btn-danger' onClick={handleDeleteSelectedItems}>ลบรายการที่เลือก</button>
          <table className="table table-striped">
            <thead>
              <tr>
              <th>
  <input type="checkbox" onChange={handleSelectAll} checked={selectAll} />
</th>
                <th onClick={() => handleSortChange('student_id')}>รหัสนักเรียน</th>
                <th onClick={() => handleSortChange('card_code')}>เลขประจำตัวประชาชน</th>
                <th onClick={() => handleSortChange('first_name')}>ชื่อ</th>
                <th onClick={() => handleSortChange('last_name')}>นามสกุล</th>
                <th>Phone Number</th>
                <th>Email</th>
                <th onClick={() => handleSortChange('class_name')}>ชั้นเรียน</th>
                <th onClick={() => handleSortChange('room_name')}>ห้อง</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
            {currentItems.map((student) => (
  <tr key={student.student_id}>
    <td>
      <input type="checkbox" onChange={(e) => handleSelectItem(e, student.student_id)} checked={selectedItems.includes(student.student_id)} />
    </td>
    <td>{student.student_id}</td>
    <td>{student.card_code}</td>
    <td>{student.first_name}</td>
    <td>{student.last_name}</td>
    <td>{student.phone_number}</td>
    <td>{student.email}</td>
    <td>{student.class_name}</td>
    <td>{student.room_name}</td>
    <td>
      <button className="btn btn-primary" style={{ fontSize: '0.6rem', marginRight: '2px' }} onClick={() => handleEditStudent(student)}><FaEdit className="mr-1" /></button>
      <button className="btn btn-danger" style={{ fontSize: '0.6rem' }} onClick={() => handleDeleteStudent(student.student_id)}><FaTrash className="mr-1" /></button>
    </td>
  </tr>
))}

            </tbody>
          </table>
          {/* Pagination */}
          <ul className="pagination">
            {[...Array(Math.ceil(sortedStudents.length / itemsPerPage)).keys()].map((number) => (
              <li key={number + 1} className="page-item">
                <button onClick={() => paginate(number + 1)} className="page-link">
                  {number + 1}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
       {showEditStudent && <EditStudent onClose={() => setShowEditStudent(false)} studentData={selectedStudentData} />}
       
    </div>
  );
}

export default AllStudents;
