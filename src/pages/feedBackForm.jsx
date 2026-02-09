import { useEffect, useState, useRef } from "react";
import "./css/bootstrap.min.css";
import "./css/style.css";
import "./css/responsive.css";
import GoodSmileIcon from "./svg/goodSmile";
import NeutralSmileIcon from "./svg/neutralIcon";
import BadSmileIcon from "./svg/badSmile";
import {
  useAddFeedbackMutation,
  useDepartmentListQuery,
  useGetImagesUrlMutation,
  useImageDeleteMutation,
} from "../service/feedback/index";
import { message } from "antd";
import { useNavigate, useParams } from "react-router-dom";
import logo from "../../src/assets/logo.svg";
import { FaUpload } from "react-icons/fa";
import banner from "../assets/Feedback-Image.jpg";
import mobileBanner from "../assets/image-Mob.jpg";
import { toast } from "react-toastify";
import VoiceRecorder from "../component/voiceRecording";

const FeedbackPage = () => {
  const { branchId } = useParams();
  const nav = useNavigate();
  const [images, setImages] = useState([]);
  const [responseImages, setResponseImages] = useState([]);
  const [trig, { data: formResponse }] = useAddFeedbackMutation();
  const [voiceNote, setVoiceNote] = useState(null); // for audio blob
  const formRef = useRef(null);

  const [formData, setFormData] = useState({
    gymHygiene: "",
    staffBehavior: "",
    images: responseImages,
    customerName: "",
    countryCode: "+91",
    mobileNumber: "",
    email: "",
    branchId: branchId,
    departmentId: "",
    department: "",
    messageText: "",
  });

  const [filePreview, setFilePreview] = useState(null);
  const [countryCodes, setCountryCodes] = useState([]);

  // Fetch country codes
  useEffect(() => {
    const fetchCodes = async () => {
      try {
        const res = await fetch(
          "https://restcountries.com/v3.1/all?fields=idd,name"
        );
        const data = await res.json();
        const codes = data
          .filter((c) => c.idd?.root && c.idd?.suffixes?.length)
          .map((c) => ({
            name: c.name.common,
            code: `${c.idd.root}${c.idd.suffixes[0]}`,
          }));
        setCountryCodes(codes.sort((a, b) => a.name.localeCompare(b.name)));
      } catch (err) {
        console.error("Error fetching country codes:", err);
      }
    };
    fetchCodes();
  }, []);

  const scrollToRef = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;

    if (type === "file" && files && files[0]) {
      const file = files[0];
      setFormData({
        ...formData,
        [name]: file,
      });
      setFilePreview(URL.createObjectURL(file));
    } else {
      let newValue = value;

      if (name === "customerName") {
        newValue = value.replace(/[^a-zA-Z\s]/g, "");
      }
      if (name === "mobileNumber") {
        newValue = value.replace(/[^0-9]/g, "");
      }

      // Map UI fields to backend fields
      if (name === "staffBehaivior") {
        setFormData({ ...formData, staffBehavior: newValue });
      } else if (name === "department") {
        // Find department id by name, or use 'Other' if Other is selected
        const dept = departmentList?.rows?.find((d) => d.name === newValue);
        setFormData({ 
          ...formData, 
          departmentId: dept?.id || (newValue === "Other" ? "Other" : ""),
          department: newValue
        });
      } else {
        setFormData({ ...formData, [name]: newValue });
      }
    }
  };

  // Validation
  const validateForm = () => {
    if (!formData.gymHygiene) {
      toast.error("Please rate gym hygiene before submitting");
      scrollToRef("gymQuestion");
      return false;
    }
    if (!formData.staffBehavior) {
      toast.error("Please rate staff behavior before submitting");
      scrollToRef("staffQuestion");
      return false;
    }
    if (!formData.departmentId && !formData.department) {
      toast.error("Please select a department");
      scrollToRef("departmentQuestion");
      return false;
    }
    if (!formData.messageText || !formData.messageText.trim()) {
      toast.error("Please write your feedback message");
      scrollToRef("departmentQuestion");
      return false;
    }
    if (!formData.customerName.trim()) {
      toast.error("Name is required");
      scrollToRef("contactSection");
      return false;
    }
    if (!formData.mobileNumber || formData.mobileNumber.length < 5) {
      toast.error("Enter a valid mobile number");
      scrollToRef("contactSection");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email || !emailRegex.test(formData.email)) {
      toast.error("Enter a valid email address");
      scrollToRef("contactSection");
      return false;
    }
    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    // Prepare payload for backend
    const payload = {
      customerName: formData.customerName,
      email: formData.email,
      mobileNumber: formData.mobileNumber,
      branchId: formData.branchId,
      departmentId: formData.departmentId,
      messageText: formData.messageText,
      images: responseImages,
      gymHygiene: formData.gymHygiene,
      staffBehavior: formData.staffBehavior,
    };
    trig(payload);
  };

  const emojiOptions = [
    { val: 1, icon: <GoodSmileIcon />, colorClass: "good" },
    { val: 2, icon: <NeutralSmileIcon />, colorClass: "neutral" },
    { val: 3, icon: <BadSmileIcon />, colorClass: "bad" },
  ];

  const [trigger, { data: imagesUrlData }] = useGetImagesUrlMutation();
  const [trigge] = useImageDeleteMutation();
  const { data: departmentList } = useDepartmentListQuery();

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const newImages = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setImages((prev) => [...prev, ...newImages]);

    if (files.length) {
      const formData = new FormData();
      files.forEach((file) => formData.append("images", file));
      trigger(formData);
    }
  };

  const handleRemoveImage = (index) => {
    setImages((prev) => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      return updated;
    });

    setResponseImages((prev) => {
      const updated = [...prev];
      const [removed] = updated.splice(index, 1);
      if (removed) trigge(removed);
      return updated;
    });
  };

  useEffect(() => {
    if (imagesUrlData?.images?.length) {
      setResponseImages((prev) => [...prev, ...imagesUrlData.images]);
    }
  }, [imagesUrlData]);

  useEffect(() => {
    if (formResponse?.success) {
      message.success(formResponse?.message);
      nav(`/thankyou/${branchId}`);
    }
  }, [formResponse]);

  return (
    <div ref={formRef}>
      {/* Header */}
      <header>
        <div className="container-fluid">
          <div className="row">
            <div className="col-2 col-sm-2 col-md-6 col-xl-5 tab-order1">
              <nav className="navbar navbar-expand-lg main-menu">
                <button
                  className="navbar-toggler"
                  type="button"
                  data-bs-toggle="collapse"
                  data-bs-target="#navbarSupportedContent"
                  aria-controls="navbarSupportedContent"
                  aria-expanded="false"
                  aria-label="Toggle navigation"
                >
                  <img
                    src="images/menu-bar.svg"
                    className="navbar-toggler-icon"
                    alt="menu"
                  />
                </button>
              </nav>
            </div>

            <div className="col-5 col-sm-5 col-md-12 col-xl-2 text-center tab-order2">
              <a href="https://fitclub.in/">
                <img
                  src={logo}
                  width="300"
                  alt="Fitclub Logo"
                  className="logo-img"
                />
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Banner */}
      <div className="banner">
        <img
          src={mobileBanner}
          alt="Mobile banner"
          className="mobile-banner"
        />
        <img src={banner} alt="Desktop banner" className="desktop-banner" />
      </div>

      {/* Feedback Form */}
      <form onSubmit={handleSubmit} id="feedback-form">
        <section className="satisfaction-review">
          <div className="container">
            <div className="row">
              {/* Hygiene */}
              <div className="col-lg-6">
                <div className="vill-experince mb-4 mb-lg-0" id="gymQuestion">
                  <h2 className="love-hve">
                    How satisfied are you with the cleanliness and hygiene in
                    the gym?
                  </h2>
                  <div className="feedback">
                    {emojiOptions.map((item, idx) => (
                      <label
                        key={idx}
                        className={`emoji ${
                          Number(formData.gymHygiene) === item.val
                            ? "selected"
                            : "light-" + item.colorClass
                        }`}
                        onClick={(e) => {
                          if (!validatePreviousFields("gymHygiene")) {
                            e.preventDefault();
                            return;
                          }
                        }}
                      >
                        <input
                          type="radio"
                          name="gymHygiene"
                          value={item.val}
                          checked={Number(formData.gymHygiene) === item.val}
                          onChange={handleChange}
                          // onFocus={handleFocus}
                          style={{ display: "none" }}
                        />
                        <span className="emoji-icon">{item.icon}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Staff */}
              <div className="col-lg-6">
                <div
                  className="vill-experince mb-4 mb-lg-0"
                  id="staffQuestion"
                >
                  <h2 className="love-hve">
                    How satisfied are you with the Staff Behavior & Support in
                    the gym?
                  </h2>
                  <div className="feedback">
                    {emojiOptions.map((item, idx) => (
                      <label
                        key={idx}
                        className={`emoji ${
                          Number(formData.staffBehaivior) === item.val
                            ? "selected"
                            : "light-" + item.colorClass
                        }`}
                        onClick={(e) => {
                          if (!validatePreviousFields("staffBehaivior")) {
                            e.preventDefault();
                            return;
                          }
                        }}
                      >
                        <input
                          type="radio"
                          name="staffBehaivior"
                          value={item.val}
                          checked={Number(formData.staffBehaivior) === item.val}
                          onChange={handleChange}
                          style={{ display: "none" }}
                        />
                        <span className="emoji-icon">{item.icon}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Department + Comment */}
            <div
              className="row mt-gp"
              id="departmentQuestion"
            >
              <div className="col-lg-8 offset-lg-2">
                <h3 className="next-vision text-center">
                  Please give specific inputs for better service
                </h3>

                <div className="row mt-4">
                  <div className="col-12">
                    <select
                      name="department"
                      className="career-field-2 form-select"
                      value={formData.department}
                      onChange={handleChange}
                    >
                      <option value="">Select Department</option>
                      {departmentList?.rows?.map((item) => {
                        if(item?.status === "active") {
                          return (
                            <option key={item?.id || item?.name} value={item?.name}>
                              {item?.name}
                            </option>
                          );
                        }
                        return null;
                      })}
                      <option value="Other">Other</option>
                    </select>

                    <label className="form-label mt-3 next-vision">
                      Share Your Thoughts
                    </label>
                    <div className="text-area-div">

                    <textarea
                      name="messageText"
                      className="franchise-txtarea w-100"
                      placeholder="Write your comment..."
                      value={formData.messageText}
                      onChange={handleChange}
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck="false"
                    />
                    {/* 🎙️ Voice Recorder */}
                    <div className="voice-icon">

<VoiceRecorder
  onAudioRecorded={(blob, url, transcript) => {
    setVoiceNote(blob);

    if (transcript) {
      setFormData((prev) => {
        const updatedText = prev.messageText
          ? `${prev.messageText} ${transcript}`
          : transcript;

        return {
          ...prev,
          messageText: updatedText,
        };
      });
    }
  }}
    // 👇 This is NEW — live update
  onTranscriptLiveUpdate={(liveTranscript) => {
    setFormData((prev) => ({
      ...prev,
      messageText: liveTranscript,
    }));
  }}
/>
                    </div>
                    </div>

                  </div>

                  {/* Images */}
                  <div>
                    <div className="d-flex flex-wrap gap-2 mb-3 mt-2">
                      {images.map((img, index) => (
                        <div
                          key={index}
                          className="position-relative"
                          style={{
                            width: "150px",
                            height: "150px",
                            overflow: "hidden",
                            borderRadius: "8px",
                            border: "1px solid #ddd",
                          }}
                        >
                          <img
                            src={img.preview}
                            alt={`Preview ${index}`}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(index)}
                            style={{
                              position: "absolute",
                              top: "5px",
                              right: "5px",
                              background: "rgba(0,0,0,0.6)",
                              border: "none",
                              borderRadius: "50%",
                              color: "#fff",
                              width: "25px",
                              height: "25px",
                              cursor: "pointer",
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>

                    <label
                      className="btn"
                      style={{ background: "#ff3c00", color: "white" }}
                    >
                      <FaUpload />
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleImageChange}
                        style={{ display: "none" }}
                      />
                    </label>
                  </div>
                </div>

                {/* Contact Details */}
                <div
                  className="feedback-form row mt-4"
                  id="contactSection"
                >
                  <div className="col-lg-12 col-md-12 col-12 mb-3">
                    <div className="row">
                      <div className="col-12 col-sm-6 mb-3">
                        <input
                          type="text"
                          name="customerName"
                          className="career-field"
                          placeholder="Full Name"
                          value={formData.customerName}
                          onChange={handleChange}
                        />
                      </div>
                      <div className="col-12 col-sm-6 mb-3 d-flex">
                        <select
                          name="countryCode"
                          className="form-select"
                          defaultValue="+91"
                          style={{
                            maxWidth: "70px",
                            marginRight: "5px",
                            background: "transparent",
                            color: "white",
                            padding: ".375rem 0rem .375rem .75rem",
                            border: "1px solid #34373b",
                          }}
                          value={formData.countryCode}
                          onChange={handleChange}
                        >
                          {countryCodes.map((c, idx) => (
                            <option key={idx} value={c.code}>
                              {c.code}
                            </option>
                          ))}
                        </select>
                        <input
                          type="text"
                          name="mobileNumber"
                          className="career-field"
                          placeholder="Mobile No"
                          value={formData.mobileNumber}
                          onChange={handleChange}
                        />
                      </div>
                    </div>

                    <div className="row">
                      <div className="col-12 col-sm-6 mb-2">
                        <input
                          type="text"
                          name="email"
                          className="career-field"
                          placeholder="Email"
                          value={formData.email}
                          onChange={handleChange}
                        />
                      </div>
                      <div className="col-12 col-sm-6 mb-2 sumit-btn">
                        <button
                          type="submit"
                          className="send_btn btn btn-black w-100"
                        >
                          Submit
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </form>
    </div>
  );
};

export default FeedbackPage;
