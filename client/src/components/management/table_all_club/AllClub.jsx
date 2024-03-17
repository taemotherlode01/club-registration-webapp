import React, { useEffect, useState } from 'react';
import { Table } from 'react-bootstrap';
import axios from 'axios';
import './AllClub.css';

const AllClubs = () => {
  const [allClubs, setAllClubs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  useEffect(() => {
    fetchAllClubs();
  }, []);

  const fetchAllClubs = async () => {
    try {
      const [clubsResponse, studentCountResponse] = await Promise.all([
        axios.get("http://localhost:4000/all_clubs"),
        axios.get("http://localhost:4000/count_students_club")
      ]);

      const clubsData = clubsResponse.data;
      const studentCountData = studentCountResponse.data;

      const groupedClubs = groupByClubId(clubsData, studentCountData);
      setAllClubs(groupedClubs);
    } catch (error) {
      console.error(error);
    }
  };

  const groupByClubId = (clubsData, studentCountData) => {
    const groupedData = {};
    clubsData.forEach((club) => {
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

      groupedData[club.club_id].teachers.push({
        teacher_id: club.teacher_id,
        first_name: club.first_name,
        last_name: club.last_name,
      });
      groupedData[club.club_id].classes.push({
        class_name: club.class_name,
        open_to_receive: club.open_to_receive,
        number_of_member: club.number_of_member,
        end_date_of_receive: club.end_date_of_receive,
      });
    });
    return Object.values(groupedData);
  };

  const handleSelectItem = (e, clubId) => {
    const checked = e.target.checked;
    let newSelectedItems = [...selectedItems];
    if (checked) {
      newSelectedItems.push(clubId);
    } else {
      newSelectedItems = newSelectedItems.filter(id => id !== clubId);
    }
    setSelectedItems(newSelectedItems);
    setSelectAll(newSelectedItems.length === allClubs.length);
  };

  const handleSelectAll = (e) => {
    const checked = e.target.checked;
    setSelectAll(checked);
    const newSelectedItems = checked ? allClubs.map(club => club.club_id) : [];
    setSelectedItems(newSelectedItems);
  };

  const handleDeleteSelectedItems = async () => {
    if (selectedItems.length > 0) {
      deleteClubs(selectedItems);
    }
  };

  const deleteClubs = async (ids) => {
    try {
      await axios.delete(`http://localhost:4000/delete_clubs`, {
        data: { clubIds: ids }
      });
      fetchAllClubs();
    } catch (error) {
      console.error("Error deleting clubs:", error);
    }
  };

  const filteredClubs = allClubs.filter(club =>
    club.club_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastClub = currentPage * itemsPerPage;
  const indexOfFirstClub = indexOfLastClub - itemsPerPage;
  const currentClubs = filteredClubs.slice(indexOfFirstClub, indexOfLastClub);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const handleDeleteClub = async (clubId) => {
    try {
      await axios.delete(`http://localhost:4000/delete_club/${clubId}`);
      fetchAllClubs();
    } catch (error) {
      console.error("Error deleting club:", error);
    }
  };

  return (
    <div className="container">
      <div className='d-flex flex-row bd-highlight mb-3'>
        <input
          type="text"
          className="form-control mt-3"
          placeholder="ค้นหาชุมนุมด้วยชื่อ"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <div className="table-responsive">
        <button className='btn btn-danger' onClick={handleDeleteSelectedItems}>ลบรายการที่เลือก</button>
        <Table striped>
          <thead>
            <tr>
              <th>
                <input type="checkbox" onChange={handleSelectAll} checked={selectAll} />
              </th>
              <th style={{ minWidth: '150px' }}>ชื่อชุมชุม</th>
              <th style={{ minWidth: '150px' }}>อาจารย์ประจำชุมนุม</th>
              <th style={{ minWidth: '80px' }}>ชั้นที่รับ</th>
              <th style={{ minWidth: '80px' }}>จำนวนที่รับ</th>
              <th style={{ minWidth: '70px' }}>จำนวนสมาชิก</th>
              <th style={{ minWidth: '100px' }}>เวลาที่ปิดรับ</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {currentClubs.map((club) => (
              <tr key={club.club_id}>
                <td>
                  <input type="checkbox" onChange={(e) => handleSelectItem(e, club.club_id)} checked={selectedItems.includes(club.club_id)} />
                </td>
                <td>{club.club_name}</td>
                <td>
                  {club.teachers.map((teacher, index, array) => {
                    const fullName = `${teacher.first_name} ${teacher.last_name}`;
                    const isDuplicate = array.slice(index + 1).some(t => `${t.first_name} ${t.last_name}` === fullName);
                    return (
                      !isDuplicate && (
                        <span key={index}>
                          {fullName}
                          {index !== array.length - 1 && ', '}
                        </span>
                      )
                    );
                  })}
                </td>
                <td>
                  {club.classes
                    .filter((cls, index, self) => 
                      index === self.findIndex((c) => (
                        c.class_name === cls.class_name
                      ))
                    )
                    .map((cls, index, array) => (
                      <span key={index}>
                        {cls.class_name.replace('มัธยมศึกษาปีที่', 'ม.')}
                        {index !== array.length - 1 && ', '}
                      </span>
                    ))}
                </td>
                <td>{club.classes[0].open_to_receive}</td>
                <td>{club.student_count}</td>
                <td>{new Date(club.classes[0].end_date_of_receive).toLocaleDateString('th-TH')}</td>
                <td>
                  <button className='btn btn-danger' onClick={() => handleDeleteClub(club.club_id)}>Delete</button>
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
    </div>
  );
};

export default AllClubs;
