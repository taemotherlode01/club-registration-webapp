// MyClub.js

import React, { useEffect, useState } from 'react';
import { Table } from 'react-bootstrap';
import axios from 'axios';
import AddClub from '../add_club/AddClub';
import EditClub from '../edit_club/EditClub';
import { FaEdit, FaTrash, FaEye } from 'react-icons/fa';
import ClubSelectionDetail from '../detail_club/ClubSelectionDetail';

const MyClub = () => {
  const [editingClub, setEditingClub] = useState(null);
  const [selectedClub, setSelectedClub] = useState(null); 
  const [allClubs, setAllClubs] = useState([]);
  const [teacherId, setTeacherId] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showClubDetail, setShowClubDetail] = useState(false); 
  const [updatedMemberCount, setUpdatedMemberCount] = useState(false); // สร้าง state ไว้เก็บค่าที่จะส่งไป update จำนวนนักเรียน

  useEffect(() => {
    const teacherSession = localStorage.getItem('@teacher');
    if (teacherSession) {
      const { id } = JSON.parse(teacherSession);
      setTeacherId(id);
      setLoggedIn(true);
    } else {
      setLoggedIn(false);
    }
  }, []);

  useEffect(() => {
    if (loggedIn) {
      fetchAllClubs();
    }
  }, [loggedIn, updatedMemberCount]); // เมื่อ updatedMemberCount เปลี่ยนค่าให้เรียก useEffect อีกครั้ง

  const fetchAllClubs = async () => {
    try {
      const response = await axios.get(`http://localhost:4000/all_clubs?teacherId=${teacherId}`);
      const data = response.data;

      const studentCountResponse = await axios.get(`http://localhost:4000/count_students_club`);
      const studentCountData = studentCountResponse.data;

      const groupedClubs = groupByClubId(data, studentCountData);
      setAllClubs(groupedClubs);
    } catch (error) {
      console.error(error);
    }
  };

  const groupByClubId = (data, studentCountData) => {
    const groupedData = {};
    data.forEach((club) => {
      if (club.teacher_id === teacherId) {
        if (!groupedData[club.club_id]) {
          groupedData[club.club_id] = {
            club_id: club.club_id,
            club_name: club.club_name,
            teachers: [],
            classes: [],
            student_count: 0
          };
        }

        const studentCountInfo = studentCountData.find(info => info.club_id === club.club_id);
        if (studentCountInfo) {
          groupedData[club.club_id].student_count = studentCountInfo.student_count;
        }

        groupedData[club.club_id].classes.push({
          class_id: club.class_id, 
          class_name: club.class_name,
          open_to_receive: club.open_to_receive,
          number_of_member: club.number_of_member,
          end_date_of_receive: club.end_date_of_receive,
        });
      }
    });

    data.forEach((club) => {
      if (groupedData[club.club_id]) {
        groupedData[club.club_id].teachers.push({
          teacher_id: club.teacher_id,
          first_name: club.first_name,
          last_name: club.last_name,
        });
      }
    });

    return Object.values(groupedData);
  };

  const handleDeleteClub = async (clubId) => {
    try {
      await axios.delete(`http://localhost:4000/delete_club/${clubId}`);
      fetchAllClubs();
    } catch (error) {
      console.error("Error deleting club:", error);
    }
  };

  const uniqueTeachers = (teachers) => {
    const unique = [];
    const uniqueIds = new Set();
    
    teachers.forEach((teacher) => {
      if (!uniqueIds.has(teacher.teacher_id)) {
        unique.push(teacher);
        uniqueIds.add(teacher.teacher_id);
      }
    });
    
    return unique;
  };

  const uniqueClasses = (classes) => {
    const unique = [];
    const uniqueNames = new Set();
    
    classes.forEach((cls) => {
      const className = cls.class_name;
      if (!uniqueNames.has(className)) {
        unique.push(cls);
        uniqueNames.add(className);
      }
    });
    
    return unique;
  };

  const handleViewClubDetails = (club) => {
    setSelectedClub(club);
    setShowClubDetail(true); 
  };

  const handleCloseClubDetail = () => {
    setShowClubDetail(false); 
  };

  const handleUpdateMemberCount = () => {
    // อัพเดทจำนวนนักเรียนโดยเปลี่ยนค่า updatedMemberCount
    setUpdatedMemberCount(prevState => !prevState);
  };

  return (
    <div className="container">
      <div className='d-flex flex-row bd-highlight mb-3'>
        <button className='btn btn-success mt-3' onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? 'ซ่อนฟอร์ม' : '+สร้างชุมนุม'}
        </button>
      </div>
      {showAddForm && <AddClub updateClubs={fetchAllClubs} />}
      {editingClub && (
        <EditClub
          club={editingClub}
          updateClubs={fetchAllClubs}
          onCancel={() => setEditingClub(null)}
        />
      )}
      <div className="table-responsive">
        <Table striped>
          <thead>
            <tr>
              <th style={{ minWidth: '150px' }}>ชื่อชุมนุม</th>
              <th style={{ minWidth: '150px' }}>ครูที่ปรึกษาชุมนุม</th>
              <th style={{ minWidth: '100px' }}>ชั้นที่รับ</th>
              <th style={{ minWidth: '80px' }}>จำนวนที่รับ</th>
              <th style={{ minWidth: '120px' }}>จำนวนสมาชิก</th>
              <th style={{ minWidth: '100px' }}>เวลาที่ปิดรับ</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {allClubs.map((club) => (
              <tr key={club.club_id}>
                <td>{club.club_name}</td>
                <td>
                  <ul>
                    {uniqueTeachers(club.teachers).map((teacher, index) => (
                      <li key={index}>{teacher.first_name} {teacher.last_name}</li>
                    ))}
                  </ul>
                </td>
                <td>
                  {uniqueClasses(club.classes).map((cls, index) => (
                    <span key={index}>
                      {cls.class_name.replace('มัธยมศึกษาปีที่', 'ม.')}
                      {index !== uniqueClasses(club.classes).length - 1 && ', '}
                    </span>
                  ))}
                </td>
                <td>{club.classes[0].open_to_receive}</td>
                <td>{club.student_count}</td>
                <td>{new Date(club.classes[0].end_date_of_receive).toLocaleDateString('th-TH')}</td>
                <td>
                  <button className='btn btn-danger' onClick={() => handleDeleteClub(club.club_id)}><FaTrash className="mr-1" /></button>
                  <button className='btn btn-primary mr-2' onClick={() => setEditingClub(club)}><FaEdit className="mr-1" /></button>
                  <button className='btn btn-info' onClick={() => handleViewClubDetails(club)}><FaEye className="mr-1" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
      {showClubDetail && <ClubSelectionDetail club={selectedClub} onClose={handleCloseClubDetail} updateMemberCount={handleUpdateMemberCount} />} {/* ส่ง updateMemberCount ไปยัง ClubSelectionDetail */}
    </div>
  );
};

export default MyClub;
