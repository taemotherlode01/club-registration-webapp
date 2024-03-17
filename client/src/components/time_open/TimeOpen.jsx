import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Form, Button, Alert, Card } from 'react-bootstrap';

export default function TimeOpen() {
    const [timeOpenData, setTimeOpenData] = useState([]);
    const [dateOfOpen, setDateOfOpen] = useState('');
    const [timeOfOpen, setTimeOfOpen] = useState('');
    const [timeOpenId, setTimeOpenId] = useState('65');
    const [timeEndOpenData, setTimeEndOpenData] = useState([]);
    const [dateEndOfOpen, setDateEndOfOpen] = useState('');
    const [timeEndOfOpen, setTimeEndOfOpen] = useState('');
    const [endTimeOpenId, setEndTimeOpenId] = useState('1');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchTimeOpen();
        fetchEndTimeOpen();
    }, []);

    const fetchTimeOpen = async () => {
        try {
            const response = await axios.get("http://localhost:4000/get_time_open");
            setTimeOpenData(response.data);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchEndTimeOpen = async () => {
        try {
            const response = await axios.get("http://localhost:4000/get_end_time_open");
            setTimeEndOpenData(response.data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleSubmitSetTimeOpen = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post(`http://localhost:4000/update_time_open/${timeOpenId}`, {
                date_of_open: dateOfOpen,
                time_of_open: timeOfOpen
            });
            if (response.status === 200) {
                setSuccess("Time open updated successfully");
                fetchTimeOpen();
            } else {
                setError("Failed to update time open");
            }
        } catch (error) {
            setError(error.message);
        }
    };

    const handleSubmitSetTimeEnd = async (e) => {
        e.preventDefault();
        try {
            const startTime = new Date(dateOfOpen + 'T' + timeOfOpen);
            const endTime = new Date(dateEndOfOpen + 'T' + timeEndOfOpen);
            if (endTime <= startTime) {
                setError("End time must be greater than start time");
                return;
            }

            const response = await axios.post(`http://localhost:4000/update_end_time_open/${endTimeOpenId}`, {
                date_end: dateEndOfOpen,
                time_end: timeEndOfOpen
            });
            if (response.status === 200) {
                setSuccess("End time open updated successfully");
                fetchEndTimeOpen();
            } else {
                setError("Failed to update end time open");
            }
        } catch (error) {
            setError(error.message);
        }
    };

    const handleDateChange = (e) => {
        setDateOfOpen(e.target.value);
    };

    const handleTimeChange = (e) => {
        setTimeOfOpen(e.target.value);
    };

    const handleDateEndChange = (e) => {
        setDateEndOfOpen(e.target.value);
    };

    const handleTimeEndChange = (e) => {
        setTimeEndOfOpen(e.target.value);
    };

    const handleAlertClose = () => {
        clearTimeout(alertTimeout);
        setError('');
        setSuccess('');
    };

    return (
        <Card style={{ maxWidth: '600px', margin: 'auto', marginTop:"20px" }}>
            <Card.Body>
                <div className='text-center'>
                    <h3 className='mt-3'>ตั้งเวลาเลือกชุมนุม</h3>
                    {success && (
                        <Alert variant="success" onClose={handleAlertClose} dismissible>
                            {success}
                            {setTimeout(() => setSuccess(''), 3000)}
                        </Alert>
                    )}
                    {error && (
                        <Alert variant="danger" onClose={handleAlertClose} dismissible>
                            {error}
                            {setTimeout(() => setError(''), 3000)}
                        </Alert>
                    )}
                    <ul style={{ listStyleType: 'none' }}>
                        {timeOpenData.map((item, index) => {
                            const date = new Date(item.date_of_open);
                            return (
                                <li key={index}>
                                    เริ่ม: {date.toLocaleDateString()}
                                </li>
                            );
                        })}
                    </ul>

                    <ul style={{ listStyleType: 'none' }}>
                        {timeEndOpenData.map((item, index) => {
                            const date = new Date(item.date_end);
                            return (
                                <li key={index}>
                                    สิ้นสุด: {date.toLocaleDateString()}
                                </li>
                            );
                        })}
                    </ul>

                    <div className="d-flex justify-content-center">
                        <Form onSubmit={handleSubmitSetTimeOpen} className="text-center mx-1">
                            <Form.Group controlId="dateOfOpen">
                                <Form.Label>เลือกวัน/เดือน/ปี</Form.Label>
                                <Form.Control type="date" value={dateOfOpen} onChange={handleDateChange} />
                            </Form.Group>
                           
                            <Button variant="primary" type="submit" className='mt-3'>
                                ตั้งเวลาเริ่ม
                            </Button>
                        </Form>

                        <Form onSubmit={handleSubmitSetTimeEnd} className="text-center">
                            <Form.Group controlId="dateEndOfOpen">
                                <Form.Label>เลือกวัน/เดือน/ปี</Form.Label>
                                <Form.Control type="date" value={dateEndOfOpen} onChange={handleDateEndChange} />
                            </Form.Group>
    
                            <Button variant="danger" type="submit" className='mt-3' disabled={!dateOfOpen}>
                                ตั้งเวลาสิ้นสุด
                            </Button>
                        </Form>
                    </div>
                </div>
            </Card.Body>
        </Card>
    );
}
