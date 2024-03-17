import React, { useState } from 'react';
import NavbarStudntLogin from '../../components/navbar/navbar_login_student/NavbarStudentLogin';
import AllClubChoose from '../../components/all_club_choose/AllClubChoose';
import ClubStudent from '../../components/club_student/ClubStudent';

export default function StudentPage() {
  const [refreshClubStudent, setRefreshClubStudent] = useState(false);

  const handleClubSelection = () => {
    setRefreshClubStudent(true);
  };

  return (
    <div>
      <NavbarStudntLogin />
      <ClubStudent refresh={refreshClubStudent} />
      <AllClubChoose onClubSelection={handleClubSelection} />
    </div>
  );
}