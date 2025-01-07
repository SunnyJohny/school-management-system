import React, { useState } from "react";
import { toast } from "react-toastify";
import { useMyContext } from "../Context/MyContext";
import { useNavigate } from "react-router-dom";

const TeachersAttendance = () => {
  const { state } = useMyContext();
  const navigate = useNavigate();
  const [isClockIn, setIsClockIn] = useState(true);
  const [isScanning, setIsScanning] = useState(false);

  // Simulated Biometric Scan
  const simulateBiometricScan = () => {
    return new Promise((resolve) => {
      setTimeout(() => resolve("sample-biometric-data"), 8000);
    });
  };

  const handleAttendance = async () => {
    setIsScanning(true);
    toast.info("Please place your finger on the scanner.", { autoClose: false });

    try {
      const scannedData = await simulateBiometricScan();
      toast.dismiss();
      setIsScanning(false);

      if (scannedData) {
        isClockIn
          ? toast.error("Clocked-in Not Successful")
          : toast.success("Clocked-out Successful");

        setIsClockIn(!isClockIn);
      } else {
        toast.error("Failed to scan biometric data. Please try again.");
      }
    } catch (error) {
      toast.dismiss();
      console.error("Error during biometric scan:", error);
      toast.error("An error occurred. Please try again.");
      setIsScanning(false);
    }
  };

  return (
    <div className="flex flex-col items-center p-4">
      {/* Back Button */}
      <button
        onClick={() => navigate("/posscreen")}
        className="self-start bg-gray-200 text-black py-2 px-4 rounded shadow-md hover:bg-gray-300 mb-4"
      >
        Back
      </button>

      <h1 className="text-2xl font-bold my-4">Teacher Attendance</h1>

      {/* Scanner Effect */}
      {isScanning && (
        <div
          className="flex flex-col items-center justify-center border border-dashed border-gray-400 rounded-lg w-72 h-72 p-4 mb-4 bg-gray-100 relative"
          style={{
            overflow: "hidden",
          }}
        >
          <p className="text-lg text-gray-700 mb-4">Scanning... Please place your finger</p>
          <div
            className="relative w-24 h-24 bg-gray-300 rounded-full border-4 border-blue-500 flex items-center justify-center"
            style={{
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "0",
                left: "50%",
                width: "4px",
                height: "100%",
                backgroundColor: "blue",
                transform: "translateX(-50%)",
                animation: "scanning-line 1.5s infinite linear",
              }}
            ></div>
          </div>
          <style>
            {`
              @keyframes scanning-line {
                0% { transform: translate(-50%, 0); }
                50% { transform: translate(-50%, 100%); }
                100% { transform: translate(-50%, 0); }
              }
            `}
          </style>
        </div>
      )}

      {/* Clock In/Out Button */}
      <button
        onClick={handleAttendance}
        className="bg-blue-500 text-white py-2 px-4 rounded shadow-md hover:bg-blue-600"
        disabled={isScanning}
      >
        {isClockIn ? "Clock In" : "Clock Out"}
      </button>

      {/* Teachers Table */}
      <div className="overflow-x-auto w-full mt-4">
        <table className="table-auto w-full border-collapse border border-gray-200">
          <thead>
            <tr className="bg-gray-200">
              <th className="px-4 py-2">Photo</th>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Class</th>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Subject</th>
              <th className="px-4 py-2">Phone</th>
              <th className="px-4 py-2">Date</th>
              <th className="px-4 py-2">Clock-In</th>
              <th className="px-4 py-2">Clock-Out</th>
            </tr>
          </thead>
          <tbody>
            {state.teachers.map((teacher, index) => (
              <tr key={index} className="border-t">
                <td className="px-4 py-2 text-center">
                  {teacher.photoURL ? (
                    <img
                      src={teacher.photoURL}
                      alt={teacher.name}
                      className="w-12 h-12 object-cover rounded-full"
                    />
                  ) : (
                    <span className="text-gray-500">No Photo</span>
                  )}
                </td>
                <td className="px-4 py-2">{teacher.name}</td>
                <td className="px-4 py-2">{teacher.class}</td>
                <td className="px-4 py-2">{teacher.email}</td>
                <td className="px-4 py-2">{teacher.subject}</td>
                <td className="px-4 py-2">{teacher.phone}</td>
                <td className="px-4 py-2">{"2025-01-02"}</td>
                <td className="px-4 py-2">{"08:10 AM"}</td>
                <td className="px-4 py-2">{"03:05 PM"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TeachersAttendance;