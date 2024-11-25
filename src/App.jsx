import React, { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";
import "./reset.css";

const App = () => {
  // 현재 슬라이드를 추적하는 상태 변수
  const [currentSlide, setCurrentSlide] = useState(0);

  // 현재 위치 정보를 저장하는 상태 변수
  const [currentLocation, setCurrentLocation] = useState(null);

  // 슬라이드 배열: 날씨 정보와 관련된 데이터 저장
  const [slides, setSlides] = useState([
    {
      id: `${Date.now()}-${Math.random()}`, // 슬라이드 고유 ID 생성
      city: "", // 도시 이름
      content: "현재 위치 날씨", // 슬라이드 내용 (날씨 정보 등)
      localTime: new Date().toTimeString().slice(0, 5), // 현재 시간 기본값
    },
  ]);

  // 모달 표시 여부를 제어하는 상태 변수
  const [showModal, setShowModal] = useState(false);

  // 새로운 도시 이름을 입력받는 상태 변수
  const [newCity, setNewCity] = useState("");

  // 에러 메시지를 저장하는 상태 변수
  const [errorMessage, setErrorMessage] = useState("");

  // API 키: 환경 변수에서 가져옴
  const API_KEY = import.meta.env.VITE_WEATHER_API_KEY;
  const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;

  // 시간 계산 함수: UTC 오프셋을 기반으로 로컬 시간과 한국 시간을 계산
  const calculateTimes = (timezoneOffset) => {
    const utcTime = new Date();
    const utcHours = utcTime.getUTCHours();
    const utcMinutes = utcTime.getUTCMinutes();

    // 시간대 오프셋을 반영한 로컬 시간 계산
    const utcOffsetInHours = timezoneOffset / 3600;
    const localHours = (utcHours + utcOffsetInHours) % 24;

    // 한 자릿수 시간과 분에 앞에 0을 붙여 포맷팅
    const formattedHours = localHours < 10 ? `0${localHours}` : localHours;
    const formattedMinutes = utcMinutes < 10 ? `0${utcMinutes}` : utcMinutes;

    const localTimeString = `${formattedHours}:${formattedMinutes}`;

    // 한국 시간 계산 (UTC +9)
    const koreanTimeHours = (localHours + (9 - utcOffsetInHours)) % 24;
    const koreanTimeString = `${koreanTimeHours}:${utcMinutes}`;

    return { localTimeString, koreanTimeString };
  };

  // 낮/밤 판단 함수: 로컬 시간을 기준으로 오전 6시~오후 6시 사이를 "day", 그 외는 "night"으로 분류
  const getDayOrNight = (localTime) => {
    if (!localTime) {
      console.error("Invalid localTime:", localTime);
      return "day"; // 기본값으로 "day" 반환
    }

    // "HH:MM" 형식의 시간을 분리하여 Date 객체에 시간 설정
    const [hours, minutes] = localTime.split(":").map(Number);
    const currentDate = new Date();
    currentDate.setHours(hours, minutes, 0, 0); // 시간을 설정

    const hour = currentDate.getHours();
    return hour >= 6 && hour < 18 ? "day" : "night";
  };

  // 유튜브 동영상 URL을 날씨에 따라 설정
  const weatherVideos = {
    맑음: {
      day: "https://www.youtube.com/embed/0P1dxSET6Kk?autoplay=1&mute=1&loop=1&playlist=0P1dxSET6Kk&vq=hd1080",
      night:
        "https://www.youtube.com/embed/bPUSrX4w9j8?autoplay=1&mute=1&loop=1&playlist=bPUSrX4w9j8&vq=hd1080",
    },
    구름_한_점_없음: {
      day: "https://www.youtube.com/embed/0P1dxSET6Kk?autoplay=1&mute=1&loop=1&playlist=0P1dxSET6Kk&vq=hd1080",
      night:
        "https://www.youtube.com/embed/bPUSrX4w9j8?autoplay=1&mute=1&loop=1&playlist=bPUSrX4w9j8&vq=hd1080",
    },
    청명한_하늘: {
      day: "https://www.youtube.com/embed/7FsuTsyQft8?autoplay=1&mute=1&loop=1&playlist=7FsuTsyQft8&vq=hd1080",
      night:
        "https://www.youtube.com/embed/3rKOefyZ_gg?autoplay=1&mute=1&loop=1&playlist=3rKOefyZ_gg&vq=hd1080",
    },
    튼구름: {
      day: "https://www.youtube.com/embed/JpSTHNNjBr8?autoplay=1&mute=1&loop=1&playlist=JpSTHNNjBr8&vq=hd1080",
      night:
        "https://www.youtube.com/embed/jnPidRMM4C8?autoplay=1&mute=1&loop=1&playlist=jnPidRMM4C8&vq=hd1080",
    },
    구름조금: {
      day: "https://www.youtube.com/embed/JpSTHNNjBr8?autoplay=1&mute=1&loop=1&playlist=JpSTHNNjBr8&vq=hd1080",
      night:
        "https://www.youtube.com/embed/jnPidRMM4C8?autoplay=1&mute=1&loop=1&playlist=jnPidRMM4C8&vq=hd1080",
    },
    구름_많음: {
      day: "https://www.youtube.com/embed/Y0moSd8bYWg?autoplay=1&mute=1&loop=1&playlist=Y0moSd8bYWg&vq=hd1080",
      night:
        "https://www.youtube.com/embed/YmUs1_dhPfc?autoplay=1&mute=1&loop=1&playlist=YmUs1_dhPfc&vq=hd1080",
    },
    흐림: {
      day: "https://www.youtube.com/embed/JpSTHNNjBr8?autoplay=1&mute=1&loop=1&playlist=JpSTHNNjBr8&vq=hd1080",
      night:
        "https://www.youtube.com/embed/bPUSrX4w9j8?autoplay=1&mute=1&loop=1&playlist=bPUSrX4w9j8&vq=hd1080",
    },
    조금_흐림: {
      day: "https://www.youtube.com/embed/JpSTHNNjBr8?autoplay=1&mute=1&loop=1&playlist=JpSTHNNjBr8&vq=hd1080",
      night:
        "https://www.youtube.com/embed/bPUSrX4w9j8?autoplay=1&mute=1&loop=1&playlist=bPUSrX4w9j8&vq=hd1080",
    },
    가벼운_비: {
      day: "https://www.youtube.com/embed/0P1dxSET6Kk?autoplay=1&mute=1&loop=1&playlist=0P1dxSET6Kk&vq=hd1080",
      night:
        "https://www.youtube.com/embed/bPUSrX4w9j8?autoplay=1&mute=1&loop=1&playlist=bPUSrX4w9j8&vq=hd1080",
    },
    보통_비: {
      day: "https://www.youtube.com/embed/6h6nINT_bFg?autoplay=1&mute=1&loop=1&playlist=6h6nINT_bFg&vq=hd1080",
      night:
        "https://www.youtube.com/embed/VWh4ucZQp0w?autoplay=1&mute=1&loop=1&playlist=VWh4ucZQp0w&vq=hd1080",
    },
    비: {
      day: "https://www.youtube.com/embed/6h6nINT_bFg?autoplay=1&mute=1&loop=1&playlist=6h6nINT_bFg&vq=hd1080",
      night:
        "https://www.youtube.com/embed/VWh4ucZQp0w?autoplay=1&mute=1&loop=1&playlist=VWh4ucZQp0w&vq=hd1080",
    },
    강한_비: {
      day: "https://www.youtube.com/embed/hD4yNv_0oZk?autoplay=1&mute=1&loop=1&playlist=hD4yNv_0oZk&vq=hd1080",
      night:
        "https://www.youtube.com/embed/dBAZIMZI95c?autoplay=1&mute=1&loop=1&playlist=dBAZIMZI95c&vq=hd1080",
    },
    이슬비: {
      day: "https://www.youtube.com/embed/6h6nINT_bFg?autoplay=1&mute=1&loop=1&playlist=6h6nINT_bFg&vq=hd1080",
      night:
        "https://www.youtube.com/embed/VWh4ucZQp0w?autoplay=1&mute=1&loop=1&playlist=VWh4ucZQp0w&vq=hd1080",
    },
    약한_이슬비: {
      day: "https://www.youtube.com/embed/6h6nINT_bFg?autoplay=1&mute=1&loop=1&playlist=6h6nINT_bFg&vq=hd1080",
      night:
        "https://www.youtube.com/embed/VWh4ucZQp0w?autoplay=1&mute=1&loop=1&playlist=VWh4ucZQp0w&vq=hd1080",
    },
    보슬비: {
      day: "https://www.youtube.com/embed/6h6nINT_bFg?autoplay=1&mute=1&loop=1&playlist=6h6nINT_bFg&vq=hd1080",
      night:
        "https://www.youtube.com/embed/VWh4ucZQp0w?autoplay=1&mute=1&loop=1&playlist=VWh4ucZQp0w&vq=hd1080",
    },
    뇌우: {
      day: "https://www.youtube.com/embed/szj59j0hz_4?autoplay=1&mute=1&loop=1&playlist=szj59j0hz_4&vq=hd1080",
      night:
        "https://www.youtube.com/embed/ktvTqknDobU?autoplay=1&mute=1&loop=1&playlist=ktvTqknDobU&vq=hd1080",
    },
    천둥번개: {
      day: "https://www.youtube.com/embed/szj59j0hz_4?autoplay=1&mute=1&loop=1&playlist=szj59j0hz_4&vq=hd1080",
      night:
        "https://www.youtube.com/embed/ktvTqknDobU?autoplay=1&mute=1&loop=1&playlist=ktvTqknDobU&vq=hd1080",
    },
    강한_뇌우: {
      day: "https://www.youtube.com/embed/szj59j0hz_4?autoplay=1&mute=1&loop=1&playlist=szj59j0hz_4&vq=hd1080",
      night:
        "https://www.youtube.com/embed/ktvTqknDobU?autoplay=1&mute=1&loop=1&playlist=ktvTqknDobU&vq=hd1080",
    },
    눈: {
      day: "https://www.youtube.com/embed/szj59j0hz_4?autoplay=1&mute=1&loop=1&playlist=szj59j0hz_4&vq=hd1080",
      night:
        "https://www.youtube.com/embed/ktvTqknDobU?autoplay=1&mute=1&loop=1&playlist=ktvTqknDobU&vq=hd1080",
    },
    가벼운_눈: {
      day: "https://www.youtube.com/embed/szj59j0hz_4?autoplay=1&mute=1&loop=1&playlist=szj59j0hz_4&vq=hd1080",
      night:
        "https://www.youtube.com/embed/ktvTqknDobU?autoplay=1&mute=1&loop=1&playlist=ktvTqknDobU&vq=hd1080",
    },
    강한_눈: {
      day: "https://www.youtube.com/embed/szj59j0hz_4?autoplay=1&mute=1&loop=1&playlist=szj59j0hz_4&vq=hd1080",
      night:
        "https://www.youtube.com/embed/ktvTqknDobU?autoplay=1&mute=1&loop=1&playlist=ktvTqknDobU&vq=hd1080",
    },
    안개: {
      day: "https://www.youtube.com/embed/szj59j0hz_4?autoplay=1&mute=1&loop=1&playlist=szj59j0hz_4&vq=hd1080",
      night:
        "https://www.youtube.com/embed/ktvTqknDobU?autoplay=1&mute=1&loop=1&playlist=ktvTqknDobU&vq=hd1080",
    },
    옅은_안개: {
      day: "https://www.youtube.com/embed/szj59j0hz_4?autoplay=1&mute=1&loop=1&playlist=szj59j0hz_4&vq=hd1080",
      night:
        "https://www.youtube.com/embed/ktvTqknDobU?autoplay=1&mute=1&loop=1&playlist=ktvTqknDobU&vq=hd1080",
    },
    실안개: {
      day: "https://www.youtube.com/embed/szj59j0hz_4?autoplay=1&mute=1&loop=1&playlist=szj59j0hz_4&vq=hd1080",
      night:
        "https://www.youtube.com/embed/ktvTqknDobU?autoplay=1&mute=1&loop=1&playlist=ktvTqknDobU&vq=hd1080",
    },
    연무: {
      day: "https://www.youtube.com/embed/szj59j0hz_4?autoplay=1&mute=1&loop=1&playlist=szj59j0hz_4&vq=hd1080",
      night:
        "https://www.youtube.com/embed/ktvTqknDobU?autoplay=1&mute=1&loop=1&playlist=ktvTqknDobU&vq=hd1080",
    },
    짙은_안개: {
      day: "https://www.youtube.com/embed/szj59j0hz_4?autoplay=1&mute=1&loop=1&playlist=szj59j0hz_4&vq=hd1080",
      night:
        "https://www.youtube.com/embed/ktvTqknDobU?autoplay=1&mute=1&loop=1&playlist=ktvTqknDobU&vq=hd1080",
    },
    먼지: {
      day: "https://www.youtube.com/embed/szj59j0hz_4?autoplay=1&mute=1&loop=1&playlist=szj59j0hz_4&vq=hd1080",
      night:
        "https://www.youtube.com/embed/ktvTqknDobU?autoplay=1&mute=1&loop=1&playlist=ktvTqknDobU&vq=hd1080",
    },
    황사: {
      day: "https://www.youtube.com/embed/szj59j0hz_4?autoplay=1&mute=1&loop=1&playlist=szj59j0hz_4&vq=hd1080",
      night:
        "https://www.youtube.com/embed/ktvTqknDobU?autoplay=1&mute=1&loop=1&playlist=ktvTqknDobU&vq=hd1080",
    },
    모래바람: {
      day: "https://www.youtube.com/embed/szj59j0hz_4?autoplay=1&mute=1&loop=1&playlist=szj59j0hz_4&vq=hd1080",
      night:
        "https://www.youtube.com/embed/ktvTqknDobU?autoplay=1&mute=1&loop=1&playlist=ktvTqknDobU&vq=hd1080",
    },
    모래_폭풍: {
      day: "https://www.youtube.com/embed/szj59j0hz_4?autoplay=1&mute=1&loop=1&playlist=szj59j0hz_4&vq=hd1080",
      night:
        "https://www.youtube.com/embed/ktvTqknDobU?autoplay=1&mute=1&loop=1&playlist=ktvTqknDobU&vq=hd1080",
    },
    화산재: {
      day: "https://www.youtube.com/embed/szj59j0hz_4?autoplay=1&mute=1&loop=1&playlist=szj59j0hz_4&vq=hd1080",
      night:
        "https://www.youtube.com/embed/ktvTqknDobU?autoplay=1&mute=1&loop=1&playlist=ktvTqknDobU&vq=hd1080",
    },
    돌풍: {
      day: "https://www.youtube.com/embed/szj59j0hz_4?autoplay=1&mute=1&loop=1&playlist=szj59j0hz_4&vq=hd1080",
      night:
        "https://www.youtube.com/embed/ktvTqknDobU?autoplay=1&mute=1&loop=1&playlist=ktvTqknDobU&vq=hd1080",
    },
    토네이도: {
      day: "https://www.youtube.com/embed/szj59j0hz_4?autoplay=1&mute=1&loop=1&playlist=szj59j0hz_4&vq=hd1080",
      night:
        "https://www.youtube.com/embed/ktvTqknDobU?autoplay=1&mute=1&loop=1&playlist=ktvTqknDobU&vq=hd1080",
    },
  };

  // 슬라이드 업데이트 함수: 슬라이드별로 날씨 데이터를 가져와 업데이트
  const updateSlidesWeather = async (slidesToUpdate) => {
    if (!slidesToUpdate || slidesToUpdate.length === 0) {
      console.warn("No slides to update.");
      return;
    }

    // 슬라이드의 날씨 데이터를 병렬로 가져와 업데이트
    const updatedSlides = await Promise.all(
      slidesToUpdate.map(async (slide) => {
        if (slide.city) {
          try {
            // 도시명으로 OpenWeather API 호출
            const response = await axios.get(
              `https://api.openweathermap.org/data/2.5/weather?q=${slide.city}&appid=${API_KEY}&units=metric&lang=kr`
            );

            const timezoneOffset = response.data.timezone;
            const { localTimeString, koreanTimeString } =
              calculateTimes(timezoneOffset);

            // 날씨 데이터와 시간 정보 업데이트
            return {
              ...slide,
              temperature: response.data.main.temp,
              description: response.data.weather[0].description,
              localTime: localTimeString || "12:00", // 기본값을 추가
              koreanTime: koreanTimeString,
            };
          } catch (error) {
            console.error("Error updating slide data:", error);
            return slide; // 에러 발생 시 기존 슬라이드 유지
          }
        }
        return slide;
      })
    );

    // 슬라이드를 업데이트하고 로컬 스토리지에 저장
    setSlides(updatedSlides);
    localStorage.setItem("slides", JSON.stringify(updatedSlides));
  };

  // 초기 슬라이드 설정 및 날씨 업데이트
  useEffect(() => {
    const savedSlides = JSON.parse(localStorage.getItem("slides")) || [
      {
        id: `${Date.now()}-${Math.random()}`,
        city: "",
        content: "현재 위치 날씨",
        localTime: new Date().toTimeString().slice(0, 5), // 기본값으로 현재 시간
      },
    ];
    setSlides(savedSlides);

    // 저장된 슬라이드를 업데이트
    updateSlidesWeather(savedSlides);
  }, []);

  // 사용자의 위치 정보를 가져오는 함수
  useEffect(() => {
    const getLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            setCurrentLocation({ latitude, longitude }); // 위치 정보를 상태에 저장
          },
          (error) => {
            console.error("Error getting location:", error);
          }
        );
      } else {
        console.error("Geolocation is not supported by this browser.");
      }
    };

    getLocation();
  }, []);

  // 현재 위치의 날씨 데이터를 가져오는 함수
  useEffect(() => {
    const fetchWeatherData = async () => {
      if (currentLocation) {
        try {
          const response = await axios.get(
            `https://api.openweathermap.org/data/2.5/weather?lat=${currentLocation.latitude}&lon=${currentLocation.longitude}&appid=${API_KEY}&units=metric&lang=kr`
          );
          // 날씨 데이터를 받아와 첫 번째 슬라이드에 업데이트
          setSlides((prevSlides) => {
            const updatedSlides = [...prevSlides];
            updatedSlides[0] = {
              ...updatedSlides[0],
              city: response.data.name,
              content: `${response.data.name} 날씨`,
              localTime: calculateTimes(response.data.timezone).localTimeString,
            };
            localStorage.setItem("slides", JSON.stringify(updatedSlides));
            return updatedSlides;
          });
        } catch (error) {
          console.error("Error fetching weather data:", error);
        }
      }
    };

    fetchWeatherData();
  }, [currentLocation]);

  // 도시 이름을 좌표로 변환하는 함수 (Google Geocoding API 사용)
  const fetchCityCoordinates = async (city) => {
    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${city}&key=${GOOGLE_API_KEY}&language=en`
      );

      if (response.data.results.length === 0) {
        throw new Error("도시를 찾을 수 없습니다.");
      }

      const { formatted_address } = response.data.results[0];
      return formatted_address;
    } catch (error) {
      console.error("Error fetching city coordinates:", error);
      throw new Error("도시를 찾을 수 없습니다.");
    }
  };
  // 새로운 슬라이드 추가 함수
  const addSlide = async () => {
    if (!newCity.trim()) return; // 입력된 도시명이 없으면 반환

    try {
      const cityInEnglish = await fetchCityCoordinates(newCity); // Google Geocoding API를 통해 도시 좌표를 가져옴

      // 가져온 도시명을 바탕으로 날씨 데이터를 가져옴
      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?q=${cityInEnglish}&appid=${API_KEY}&units=metric&lang=kr`
      );

      const timezoneOffset = response.data.timezone;
      const { localTimeString, koreanTimeString } =
        calculateTimes(timezoneOffset);

      // 새로운 슬라이드 생성
      const newSlide = {
        id: `${Date.now()}-${Math.random()}`,
        city: cityInEnglish,
        temperature: response.data.main.temp,
        description: response.data.weather[0].description,
        localTime: localTimeString || "12:00", // 기본값 설정
        koreanTime: koreanTimeString,
      };

      // 슬라이드 배열에 추가하고 로컬 스토리지에 저장
      const updatedSlides = [...slides, newSlide];
      setSlides(updatedSlides);
      localStorage.setItem("slides", JSON.stringify(updatedSlides));

      await updateSlidesWeather(updatedSlides); // 슬라이드 날씨 업데이트

      setNewCity(""); // 입력 필드를 초기화
      setShowModal(false); // 모달 닫기
    } catch (error) {
      setErrorMessage("해당 도시를 찾을 수 없습니다.");
      console.error("Error fetching weather data for the city:", error);
    }
  };

  // 슬라이드 삭제 함수
  const deleteSlide = (id) => {
    const updatedSlides = slides.filter((slide) => slide.id !== id);
    setSlides(updatedSlides);

    localStorage.setItem("slides", JSON.stringify(updatedSlides)); // 삭제 후 로컬 스토리지 업데이트
  };

  // 이전 슬라이드로 이동
  const goToPreviousSlide = () => {
    setCurrentSlide(
      (prevSlide) => (prevSlide - 1 + slides.length) % slides.length
    );
  };

  // 다음 슬라이드로 이동
  const goToNextSlide = () => {
    setCurrentSlide((prevSlide) => (prevSlide + 1) % slides.length);
  };

  // 한국 시간을 가져오는 함수
  const getKoreanTime = () => {
    const date = new Date();
    const utcTime = date.getTime() + date.getTimezoneOffset() * 60000;
    const koreanTime = new Date(utcTime + 9 * 3600000);

    const timeString = koreanTime.toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    return timeString;
  };

  return (
    <div className="slider-container">
      <div
        className="slider"
        style={{ transform: `translateY(-${currentSlide * 100}vh)` }}
      >
        {slides.map((slide, index) => {
          const weatherCondition = slide.description
            ? slide.description.replace(/\s/g, "_")
            : "";

          const localTime = slide.localTime || "12:00"; // 기본값 제공
          const timeOfDay = getDayOrNight(localTime);

          const videoSrc = weatherVideos[weatherCondition]
            ? weatherVideos[weatherCondition][timeOfDay]
            : "";

          return (
            <div key={slide.id} className="slide">
              <div id="backgroundVideo">
                <iframe
                  src={videoSrc}
                  title="YouTube video player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                ></iframe>
              </div>
              <h1>{slide.city} 날씨</h1>
              <p>온도: {slide.temperature}°C</p>
              <p>날씨: {slide.description}</p>
              <p>현지 시간 (KST): {slide.localTime}</p>
              <p>한국 시간 (KST): {getKoreanTime()}</p>
            </div>
          );
        })}
      </div>
      <button className="prev" onClick={goToPreviousSlide}>
        이전
      </button>
      <button className="next" onClick={goToNextSlide}>
        다음
      </button>

      <button onClick={() => setShowModal(true)} className="slide__add-btn">
        슬라이드 추가
      </button>

      {showModal && (
        <div className="modal">
          <h2>새로운 나라 추가</h2>
          <input
            type="text"
            value={newCity}
            onChange={(e) => setNewCity(e.target.value)}
            placeholder="도시 이름을 입력하세요"
          />
          <button onClick={addSlide}>추가</button>
          <button onClick={() => setShowModal(false)}>취소</button>
          <div className="delete-buttons">
            {slides.map((slide) => (
              <div key={slide.id}>
                <span>{slide.city}</span>
                {slide.id !== slides[0].id && (
                  <button onClick={() => deleteSlide(slide.id)}>삭제</button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
