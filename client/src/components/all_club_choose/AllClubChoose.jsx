import React, { useEffect, useState } from 'react';
import { Table, Modal, Button } from 'react-bootstrap';
import './AllClub.css';
import axios from 'axios';

const AllClubChoose = ({ onClubSelection }) => {
  const [allClubs, setAllClubs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [clubMemberCounts, setClubMemberCounts] = useState({});
  const [studentId, setStudentId] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedClubId, setSelectedClubId] = useState(null);
  const [alreadyChosen, setAlreadyChosen] = useState(false);
  const [studentClassId, setStudentClassId] = useState('');
  const [isWithinOpeningHours, setIsWithinOpeningHours] = useState(true); // New state for opening hours check

  useEffect(() => {
    fetchAllClubs();
    fetchClubMemberCounts();
    const studentSession = localStorage.getItem('@student');
    if (studentSession) {
      const { id, class_id } = JSON.parse(studentSession);
      setStudentId(id);
      setStudentClassId(class_id);
    }
    fetchOpeningHours(); // Fetch opening hours data when component mounts
  }, []);

  const fetchAllClubs = async () => {
    try {
      const response = await axios.get("http://localhost:4000/all_clubs_student");
      const data = response.data;
      const groupedClubs = groupByClubId(data);
      setAllClubs(groupedClubs);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchClubMemberCounts = async () => {
    try {
      const response = await axios.get("http://localhost:4000/count_students_club");
      const data = response.data;
      const memberCounts = {};
      data.forEach((club) => {
        memberCounts[club.club_id] = club.student_count;
      });
      setClubMemberCounts(memberCounts);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchOpeningHours = async () => {
    try {
      const response = await axios.get("http://localhost:4000/combined_time_data");
      const { timeOpenData, endTimeOpenData } = response.data;
      const currentTime = new Date();
      const openingTime = new Date(timeOpenData[0].date_of_open);
      const closingTime = new Date(endTimeOpenData[0].date_end);
      setIsWithinOpeningHours(currentTime >= openingTime && currentTime <= closingTime);
    } catch (error) {
      console.error(error);
    }
  };

  const groupByClubId = (data) => {
    const groupedData = {};
    data.forEach((club) => {
      const clubId = club.club_id;
      if (!groupedData[clubId]) {
        groupedData[clubId] = {
          club_id: clubId,
          club_name: club.club_name,
          teachers: [],
          classes: [],
        };
      }

      const existingTeacherIndex = groupedData[clubId].teachers.findIndex(teacher => teacher.teacher_id === club.teacher_id);
      if (existingTeacherIndex === -1) {
        groupedData[clubId].teachers.push({
          teacher_id: club.teacher_id,
          first_name: club.first_name,
          last_name: club.last_name,
        });
      }

      const existingClassIndex = groupedData[clubId].classes.findIndex(cls => cls.class_name === club.class_name);
      if (existingClassIndex === -1) {
        groupedData[clubId].classes.push({
          class_id: club.class_id,
          class_name: club.class_name,
          open_to_receive: club.open_to_receive,
          number_of_member: club.number_of_member,
          end_date_of_receive: club.end_date_of_receive,
        });
      }
    });
    return Object.values(groupedData);
  };

  const filteredClubs = allClubs.filter(club =>
    club.club_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastClub = currentPage * itemsPerPage;
  const indexOfFirstClub = indexOfLastClub - itemsPerPage;
  const currentClubs = filteredClubs.slice(indexOfFirstClub, indexOfLastClub);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const handleSelectClub = async (clubId) => {
    setSelectedClubId(clubId);
    setShowModal(true);
  };

  const handleConfirmSelection = async () => {
  try {
    const response = await axios.post("http://localhost:4000/student_choose", {
      student_id: studentId,
      club_id: selectedClubId
    });
    if (response.status === 200) {
      console.log('Club selected:', selectedClubId);
      setAlreadyChosen(true); // ตั้งค่า alreadyChosen เป็น true เมื่อเลือกชุมนุมแล้ว

      // บันทึกข้อมูลการเลือกชุมนุมลงใน Local Storage หรือ Session Storage
      localStorage.setItem('clubSelection', 'selected');

      // After successfully selecting a club, call the function passed in through props to refresh ClubStudent
      onClubSelection();
    } else {
      console.error('Failed to select club');
    }
  } catch (error) {
    console.error(error);
  }
  setShowModal(false);
};


  const currentDate = new Date();

  if (!isWithinOpeningHours) {
    return <div style={{textAlign: "center"}}>ไม่ได้อยู่ในเวลาทำการ</div>;
  }

  return (
    <div className="container">
      <div className='d-flex flex-row bd-highlight mb-3'>
        <input
          type="text"
          className='form-control'
          placeholder="ค้นหาชุมนุม"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{maxWidth:"500px"}}
        />
      </div>
      <h3>รายชื่อชุมนุม</h3>
      <div className="table-responsive">
        <Table striped bordered hover>
          <thead>
            <tr>
              <th style={{ minWidth: '150px' }}>ชื่อชุมนุม</th>
              <th style={{ minWidth: '150px' }}>ครูที่ปรึกษา</th>
              <th style={{ minWidth: '80px' }}>ชั้นที่รับ</th>
              <th style={{ minWidth: '80px' }}>จำนวนที่รับ</th>
              <th style={{ minWidth: '70px' }}>จำนวนสมาชิก</th>
              <th style={{ minWidth: '100px' }}>วันที่ปิดรับ</th>
              <th>เลือก</th>
            </tr>
          </thead>
          <tbody>
            {currentClubs.map((club) => (
              <tr key={club.club_id}>
                <td>{club.club_name}</td>
                <td>
                  {club.teachers.map((teacher, index) => (
                    <span key={index}>
                      {teacher.first_name} {teacher.last_name}
                      {index !== club.teachers.length - 1 && ', '}
                    </span>
                  ))}
                </td>
                <td>
                  {club.classes.map((cls, index) => (
                    <span key={index}>
                      {cls.class_name.replace('มัธยมศึกษาปีที่', 'ม.')}
                      {index !== club.classes.length - 1 && ', '}
                    </span>
                  ))}
                </td>
                <td>{club.classes[0].open_to_receive}</td>
                <td>{clubMemberCounts[club.club_id] || 0}</td>
                <td>{new Date(club.classes[0].end_date_of_receive).toLocaleDateString('th-TH')}</td>
                <td>
                  <button
                    className={`btn ${alreadyChosen || !club.classes.some(cls => cls.class_id === studentClassId) || (clubMemberCounts[club.club_id] || 0) >= club.classes[0].open_to_receive || currentDate >= new Date(club.classes[0].end_date_of_receive) ? 'btn-danger' : 'btn-primary'}`}
                    onClick={() => handleSelectClub(club.club_id)}
                    disabled={alreadyChosen || !club.classes.some(cls => cls.class_id === studentClassId) || (clubMemberCounts[club.club_id] || 0) >= club.classes[0].open_to_receive || currentDate >= new Date(club.classes[0].end_date_of_receive)}
                  >
                    {alreadyChosen || !club.classes.some(cls => cls.class_id === studentClassId) || (clubMemberCounts[club.club_id] || 0) >= club.classes[0].open_to_receive || currentDate >= new Date(club.classes[0].end_date_of_receive) ? 'ล็อก' : 'เลือก'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
      <ul className="pagination">
        {[...Array(Math.ceil(filteredClubs.length / itemsPerPage)).keys()].map((number) => (
          <li key={number + 1} className="page-item">
            <button onClick={() => paginate(number + 1)} className="page-link">
              {number + 1}
            </button>
          </li>
        ))}
      </ul>
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>ยืนยันการเลือกชุมนุม</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          คุณแน่ใจหรือว่าจะเลือกชุมนุมนี้
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            ยกเลิก
          </Button>
          <Button variant="primary" onClick={handleConfirmSelection}>
            ยืนยัน
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default AllClubChoose;
