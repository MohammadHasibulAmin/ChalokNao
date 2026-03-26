import React, { useState } from "react";
import axios from "axios";

const Upload = () => {
    const [file, setFile] = useState(null);
    const [message, setMessage] = useState("");

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file) {
            setMessage("Please select a file to upload");
            return;
        }

        const formData = new FormData();
        formData.append("document", file);

        const user = JSON.parse(localStorage.getItem("user"));
        if (!user) {
            setMessage("User not found. Please login first.");
            return;
        }

        try {
            const res = await axios.post(
                `http://localhost:5000/api/drivers/upload/${user.id}`,
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                }
            );
            setMessage(`File uploaded successfully: ${res.data.filename}`);
        } catch (err) {
            setMessage(err.response?.data?.message || "Upload failed");
        }
    };

    return (
        <div>
            <h2>Upload Document</h2>
            {message && <p>{message}</p>}
            <form onSubmit={handleUpload}>
                <input type="file" onChange={handleFileChange} />
                <button type="submit">Upload</button>
            </form>
        </div>
    );
};

export default Upload;