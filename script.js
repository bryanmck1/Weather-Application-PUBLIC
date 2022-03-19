"use strict";

const openWeatherAPI_KEY = "YOUR OPENWEATHER API KEY";
const breezoAPI = "YOUR BREEZO API KEY";
const ipWhoIsAPI_Key = "YOUR IPWHOIS.IO API KEY";

//Global function that converts wind direction from a degree number into a direction
function getDirection(angle) {
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const index = Math.round(((angle %= 360) < 0 ? angle + 360 : angle) / 45) % 8;
  return directions[index];
}

//Global function that is used to give a description based on the air quality index
const airQualityValues = [20, 40, 60, 80, 101];
function airQualityDesc(airQuality) {
  if (airQuality < airQualityValues[0]) {
    return "Poor";
  } else if (airQuality < airQualityValues[1]) {
    return "Low";
  } else if (airQuality < airQualityValues[2]) {
    return "Moderate";
  } else if (airQuality < airQualityValues[3]) {
    return "Good";
  } else if (airQuality < airQualityValues[4]) {
    return "Excellent";
  }
}

//Retreives users public IP address upon page load to find their current location
let ip = ""; // Current IP
const XMLHttp = new XMLHttpRequest();
XMLHttp.onreadystatechange = function () {
  if (this.readyState == 4 && this.status == 200) {
    const json = JSON.parse(this.responseText);
    //Passes users current location into two weather APIs and shows results
    async function getWeather() {
      const city = json.city;
      const state = json.region;
      const country = json.country_code;
      const url = `https://api.openweathermap.org/data/2.5/weather?q=${city},${state}&appid=${openWeatherAPI_KEY}&units=imperial`;
      const response = await fetch(url);
      const data = await response.json();
      const lat = json.latitude;
      const lon = json.longitude;
      const oneCallURL = `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&appid=${openWeatherAPI_KEY}&units=imperial`;
      const oneCallResponse = await fetch(oneCallURL);
      const oneCallData = await oneCallResponse.json();
      const airQualityURL = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${openWeatherAPI_KEY}`;
      const airQualityResponse = await fetch(airQualityURL);
      const airQualityData = await airQualityResponse.json();

      const { feels_like, temp, temp_max, temp_min } = data.main;
      const { main } = data.weather[0];
      const { temp: hourlyTemp } = oneCallData.hourly[1];
      const { dt: date } = oneCallData.daily[0];
      const { aqi: airQuality } = airQualityData.list[0].main;

      //Fills the top mod with current weather data
      document.getElementById("cityName").textContent = data.name;
      document.getElementById("currentTemp").innerHTML = `${Math.trunc(
        temp
      )}&#176`;
      document.getElementById("hiTemp").innerHTML = `H:${Math.trunc(
        temp_max
      )}&#176`;
      document.getElementById("lowTemp").innerHTML = `L:${Math.trunc(
        temp_min
      )}&#176`;
      document.getElementById(
        "feelsLikeTemp"
      ).innerHTML = `Feels like ${Math.trunc(feels_like)}&#176`;
      document.getElementById("weatherDescription").textContent = main;

      //Retreives and fills data for 'Today's Details' module
      const {
        wind_deg: windDirection,
        wind_speed,
        humidity,
        pressure,
        dew_point,
        uvi,
        visibility,
        sunrise,
        sunset,
        clouds,
      } = oneCallData.current;
      document.getElementById("windDirSpeed").innerHTML = `${getDirection(
        windDirection
      )} ${Math.trunc(wind_speed)}mph`;
      document.getElementById("humidity").innerHTML = `${humidity}%`;
      document.getElementById("pressure").innerHTML = pressure;
      document.getElementById("dewPoint").innerHTML = `${Math.trunc(
        dew_point
      )}&#176`;
      document.getElementById("uvIndex").innerHTML = uvi;
      document.getElementById("visibility").innerHTML = `${Math.round(
        visibility / 1609.344
      )}mi`;
      document.getElementById("sunriseSunset").innerHTML = `${moment
        .unix(sunrise)
        .format("h:mm a")}|${moment.unix(sunset).format("h:mm a")}`;
      document.getElementById("cloudiness").innerHTML = `${clouds}%`;

      //Air Quality Mod
      const breezoURL = `https://api.breezometer.com/air-quality/v2/current-conditions?lat=${lat}&lon=${lon}&key=${breezoAPI}&features=breezometer_aqi,pollutants_aqi_information&metadata=true`;
      const breezoResponse = await fetch(breezoURL);
      const breezoData = await breezoResponse.json();
      const { aqi: breezoAQI } = breezoData.data.indexes.baqi;
      const { aqi: coAQI } = breezoData.data.pollutants.co.aqi_information.baqi;
      const { aqi: no2AQI } =
        breezoData.data.pollutants.no2.aqi_information.baqi;
      const { aqi: o3AQI } = breezoData.data.pollutants.o3.aqi_information.baqi;
      const { aqi: pm10AQI } =
        breezoData.data.pollutants.pm10.aqi_information.baqi;
      const { aqi: pm25AQI } =
        breezoData.data.pollutants.pm25.aqi_information.baqi;
      const { aqi: so2AQI } =
        breezoData.data.pollutants.so2.aqi_information.baqi;

      document.getElementById("currentAirQuality").innerHTML = breezoAQI;
      document.getElementById(
        "airQualityDesc"
      ).innerHTML = `This is considered ${airQualityDesc(breezoAQI)}`;
      document.getElementById("co").innerHTML = coAQI;
      document.getElementById("coDescription").innerHTML =
        airQualityDesc(coAQI);
      document.getElementById("no2").innerHTML = no2AQI;
      document.getElementById("no2Description").innerHTML =
        airQualityDesc(no2AQI);

      document.getElementById("o3").innerHTML = o3AQI;
      document.getElementById("o3Description").innerHTML =
        airQualityDesc(o3AQI);
      document.getElementById("pm10").innerHTML = pm10AQI;
      document.getElementById("pm10Description").innerHTML =
        airQualityDesc(pm10AQI);

      document.getElementById("pm25").innerHTML = pm25AQI;
      document.getElementById("pm25Description").innerHTML =
        airQualityDesc(pm25AQI);

      document.getElementById("so2").innerHTML = so2AQI;
      document.getElementById("so2Description").innerHTML =
        airQualityDesc(so2AQI);

      return oneCallData;
    }

    //Creates and then fills the "hourly forecasts" module
    getWeather().then((data) => {
      const entireHourlyMod = document.getElementById("entireHourlyMod");
      for (let i = 0; i < 48; i++) {
        const { temp: hourlyTemp, dt: time } = data.hourly[i];
        const { icon } = data.hourly[i].weather[0];
        const newDivChild = document.createElement("div");
        const newHourDiv = entireHourlyMod.appendChild(newDivChild);
        const newTimeSpan = document.createElement("span");
        const newIconImg = document.createElement("img");
        const newTempSpan = document.createElement("span");
        newHourDiv.appendChild(newTimeSpan);
        newHourDiv.appendChild(newIconImg);
        newHourDiv.appendChild(newTempSpan);
        newHourDiv.className = "hourlyDivs";
        newTimeSpan.id = `timeSpan${i}`;
        newIconImg.id = `iconImg${i}`;
        newTempSpan.id = `tempSpan${i}`;
        newTimeSpan.classList.add("hourlyTime");
        newTempSpan.classList.add("hourlyTemp");
        newTimeSpan.innerHTML = moment.unix(time).format("ha");
        newIconImg.src = `img/${icon}.png`;
        newIconImg.classList.add("hourlyIcons");
        newTempSpan.innerHTML = `${Math.trunc(hourlyTemp)}&#176`;
      }

      //Creates and fills the hourly forecast table that is shown on bigger screens

      for (let i = 0; i < 1; i++) {
        const trow = document.createElement("row");
        document.getElementById("hourlyTableHead").appendChild(trow);
        const heading1 = document.createElement("th");
        heading1.innerHTML = "Time";
        const heading2 = document.createElement("th");
        heading2.innerHTML = "Conditions";
        const heading3 = document.createElement("th");
        heading3.innerHTML = "Temp";
        const heading4 = document.createElement("th");
        heading4.innerHTML = "Feels like";
        const heading5 = document.createElement("th");
        heading5.innerHTML = "Precip.";
        const heading6 = document.createElement("th");
        heading6.innerHTML = "Humidity";
        const heading7 = document.createElement("th");
        heading7.innerHTML = "Wind";

        trow.appendChild(heading1);
        trow.appendChild(heading2);
        trow.appendChild(heading3);
        trow.appendChild(heading4);
        trow.appendChild(heading5);
        trow.appendChild(heading6);
        trow.appendChild(heading7);

        for (let i = 0; i < 48; i++) {
          const {
            dt: time,
            temp,
            feels_like,
            pop: rainPerc,
            humidity,
            wind_deg: windDirection,
            wind_speed,
          } = data.hourly[i];
          const { icon } = data.hourly[i].weather[0];
          const trow = document.createElement("row");
          document.getElementById("hourlyTableBody").appendChild(trow);
          const timeCol = document.createElement("td");
          timeCol.innerHTML = moment.unix(time).format("ha");
          timeCol.id = `timeColId${i}`;
          const conditionCol = document.createElement("td");
          conditionCol.innerHTML = `<img src="img/${icon}.png" alt="">`;
          conditionCol.classList.add("hourlyTableIcon");
          conditionCol.id = `conditionColId${i}`;
          const tempCol = document.createElement("td");
          tempCol.innerHTML = `${Math.trunc(temp)}&#176`;
          tempCol.id = `tempColId${i}`;
          const feelsLikeCol = document.createElement("td");
          feelsLikeCol.innerHTML = `${Math.trunc(feels_like)}&#176`;
          feelsLikeCol.id = `feelsLikeColId${i}`;
          const precipCol = document.createElement("td");
          precipCol.innerHTML = `${Math.trunc(rainPerc * 100)}%`;
          precipCol.id = `precipColId${i}`;
          const humidCol = document.createElement("td");
          humidCol.innerHTML = humidity;
          humidCol.id = `humidColId${i}`;
          const windCol = document.createElement("td");
          windCol.innerHTML = `${Math.trunc(wind_speed)}mph ${getDirection(
            windDirection
          )}`;
          windCol.id = `windColId${i}`;
          trow.appendChild(timeCol);
          trow.appendChild(conditionCol);
          trow.appendChild(tempCol);
          trow.appendChild(feelsLikeCol);
          trow.appendChild(precipCol);
          trow.appendChild(humidCol);
          trow.appendChild(windCol);
        }
      }

      //Creates and then fills the "daily forecasts" module
      for (let i = 1; i < 8; i++) {
        const entireDailyMod = document.getElementById("entireDailyMod");
        const {
          dt: date,
          wind_speed,
          wind_deg: windDirection,
          pop: rainPercentage,
        } = data.daily[i];
        const { icon } = data.daily[i].weather[0];
        const { min: lowTemp, max: hiTemp } = data.daily[i].temp;
        const createNewDiv = document.createElement("div");
        const newDailyDiv = entireDailyMod.appendChild(createNewDiv);
        const newDateDiv = document.createElement("div");
        const newDaySpan = document.createElement("span");
        const newDateSpan = document.createElement("span");
        const newIconImg = document.createElement("img");
        const newTempDiv = document.createElement("div");
        const newTempImg = document.createElement("img");
        const newTempSpan = document.createElement("span");
        const newWindImg = document.createElement("img");
        const newWindDiv = document.createElement("div");
        const newWindSpan = document.createElement("span");
        const newRainSpan = document.createElement("span");
        const newRainImg = document.createElement("img");
        const newRainDiv = document.createElement("div");

        newDailyDiv.appendChild(newDateDiv);
        newDateDiv.appendChild(newDaySpan);
        newDateDiv.appendChild(newDateSpan);
        newDailyDiv.appendChild(newIconImg);
        newDailyDiv.appendChild(newTempDiv);
        newTempDiv.appendChild(newTempImg);
        newTempDiv.appendChild(newTempSpan);
        newDailyDiv.appendChild(newWindDiv);
        newWindDiv.appendChild(newWindImg);
        newWindDiv.appendChild(newWindSpan);
        newDailyDiv.appendChild(newRainDiv);
        newRainDiv.appendChild(newRainImg);
        newRainDiv.appendChild(newRainSpan);
        newDailyDiv.className = "dailyDivs";
        newDateDiv.classList.add("dailyDateDiv");
        newTempImg.classList.add("dailyTempIcon");
        newTempDiv.classList.add("dailyTempDiv");
        newRainDiv.classList.add("dailyRainDiv");
        newRainImg.classList.add("dailyIcons");
        newRainImg.classList.add("dailyRainIcon");
        newWindDiv.classList.add("dailyWindDiv");
        newWindImg.classList.add("dailyIcons");
        newWindImg.classList.add("dailyWindIcon");
        newTempSpan.classList.add("dailyTempSpan");
        newIconImg.classList.add("dailyIcons");
        newDateSpan.id = `dateSpan${i}`;
        newIconImg.id = `dailyIconImg${i}`;
        newTempSpan.id = `dailyTempSpan${i}`;
        newWindSpan.id = `windSpan${i}`;
        newRainSpan.id = `dailyRainPerc${i}`;
        newDaySpan.id = `daySpan${i}`;
        newDaySpan.innerHTML = moment.unix(date).format("ddd");
        newDateSpan.innerHTML = moment.unix(date).format("M/D");
        newIconImg.src = `img/${icon}.png`;
        newTempImg.src = "img/thermometer.png";
        newTempSpan.innerHTML = `${Math.trunc(hiTemp)}&#176 / ${Math.trunc(
          lowTemp
        )}&#176 `;
        newWindImg.src = "img/wind.png";
        newWindSpan.innerHTML = `${Math.trunc(wind_speed)}mph ${getDirection(
          windDirection
        )}`;
        newRainImg.src = "img/raindrop.png";
        newRainSpan.innerHTML = `${Math.trunc(rainPercentage * 100)}%`;
      }
    });
  }
};
XMLHttp.open(
  "GET",
  `https://ipwhois.pro/json/${ip}?key=${ipWhoIsAPI_Key}`,
  true
);
XMLHttp.send();

//Search input Autocomplete for cities
let autocomplete;
function initAutocomplete() {
  autocomplete = new google.maps.places.Autocomplete(
    document.getElementById("autocomplete"),
    {
      types: ["(cities)"],
      fields: ["address_component"],
    }
  );

  autocomplete.setComponentRestrictions({
    country: ["US", "CA", "MX", "GB", "DE", "FR", "ES"],
  });
  //Passes the selected value from the search input into two weather APIs and shows results for that city
  autocomplete.addListener("place_changed", async function getWeather() {
    const place = autocomplete.getPlace();
    const city = autocomplete.getPlace().address_components[0].long_name;
    let state = null;
    //Loop that iterates through the place object to return the state of the searched city. The states aren't always in the same array location.
    for (
      let i = 0;
      i < autocomplete.getPlace().address_components.length;
      i++
    ) {
      if (
        autocomplete.getPlace().address_components[i].types[0] ===
        "administrative_area_level_1"
      ) {
        state = autocomplete.getPlace().address_components[i].long_name;
      }
    }
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city},${state}&appid=${openWeatherAPI_KEY}&units=imperial`;
    const response = await fetch(url);
    const data = await response.json();
    const lat = data.coord.lat;
    const lon = data.coord.lon;
    const oneCallURL = `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&appid=${openWeatherAPI_KEY}&units=imperial`;
    const oneCallResponse = await fetch(oneCallURL);
    const oneCallData = await oneCallResponse.json();
    const airQualityURL = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${openWeatherAPI_KEY}`;
    const airQualityResponse = await fetch(airQualityURL);
    const airQualityData = await airQualityResponse.json();
    const { aqi: airQuality } = airQualityData.list[0].main;
    const { feels_like, temp, temp_max, temp_min } = data.main;
    const { description } = data.weather[0];

    //Fills the top mod with current weather data of searched city
    document.getElementById("cityName").textContent = data.name;
    document.getElementById("currentTemp").innerHTML = `${Math.trunc(
      temp
    )}&#176`;
    document.getElementById("hiTemp").innerHTML = `H:${Math.trunc(
      temp_max
    )}&#176`;
    document.getElementById("lowTemp").innerHTML = `L:${Math.trunc(
      temp_min
    )}&#176`;
    document.getElementById(
      "feelsLikeTemp"
    ).innerHTML = `Feels like ${Math.trunc(feels_like)}&#176`;
    document.getElementById("weatherDescription").textContent = description;

    //Fills hourly forecast for searched city
    for (let i = 0; i < 48; i++) {
      const { temp: hourlyTemp, dt: time } = oneCallData.hourly[i];
      const { icon } = oneCallData.hourly[i].weather[0];

      document.getElementById(`timeSpan${i}`).innerHTML = moment
        .unix(time)
        .format("ha");
      document.getElementById(`iconImg${i}`).src = `img/${icon}.png`;
      document.getElementById(`tempSpan${i}`).innerHTML = `${Math.trunc(
        hourlyTemp
      )}&#176`;
    }

    //Hourly forecast for table on large screens

    for (let i = 0; i < 48; i++) {
      const {
        dt: time,
        temp,
        feels_like,
        pop: rainPerc,
        humidity,
        wind_deg: windDirection,
        wind_speed,
      } = oneCallData.hourly[i];
      const { icon } = oneCallData.hourly[i].weather[0];

      document.getElementById(`timeColId${i}`).innerHTML = moment
        .unix(time)
        .format("ha");
      document.getElementById(
        `conditionColId${i}`
      ).innerHTML = `<img src="img/${icon}.png" alt="">`;
      document.getElementById(`tempColId${i}`).innerHTML = `${Math.trunc(
        temp
      )}&#176`;
      document.getElementById(`feelsLikeColId${i}`).innerHTML = `${Math.trunc(
        feels_like
      )}&#176`;
      document.getElementById(`precipColId${i}`).innerHTML = `${Math.trunc(
        rainPerc * 100
      )}%`;
      document.getElementById(`humidColId${i}`).innerHTML = humidity;
      document.getElementById(`windColId${i}`).innerHTML = `${Math.trunc(
        wind_speed
      )}mph ${getDirection(windDirection)}`;
    }

    //Fills daily forecast for searched city
    for (let i = 1; i < 8; i++) {
      const {
        dt: date,
        wind_speed,
        wind_deg: windDirection,
        pop: rainPercentage,
      } = oneCallData.daily[i];
      const { icon } = oneCallData.daily[i].weather[0];
      const { min: lowTemp, max: hiTemp } = oneCallData.daily[i].temp;
      console.log(description);
      document.getElementById(`dateSpan${i}`).innerHTML = moment
        .unix(date)
        .format("M/D");
      document.getElementById(`daySpan${i}`).innerHTML = moment
        .unix(date)
        .format("ddd");
      document.getElementById(`dailyIconImg${i}`).src = `img/${icon}.png`;
      document.getElementById(`dailyTempSpan${i}`).innerHTML = `${Math.trunc(
        hiTemp
      )}&#176 / ${Math.trunc(lowTemp)}&#176 `;
      document.getElementById(`windSpan${i}`).innerHTML = `${Math.trunc(
        wind_speed
      )}mph ${getDirection(windDirection)}`;
      document.getElementById(`dailyRainPerc${i}`).innerHTML = `${Math.trunc(
        rainPercentage * 100
      )}%`;
    }

    //Today's Details for searched city
    const {
      wind_deg: windDirection,
      wind_speed,
      humidity,
      pressure,
      dew_point,
      uvi,
      visibility,
      sunrise,
      sunset,
      clouds,
    } = oneCallData.current;
    document.getElementById("windDirSpeed").innerHTML = `${Math.trunc(
      wind_speed
    )}mph ${getDirection(windDirection)}`;
    document.getElementById("humidity").innerHTML = `${humidity}%`;
    document.getElementById("pressure").innerHTML = pressure;
    document.getElementById("dewPoint").innerHTML = `${Math.trunc(
      dew_point
    )}&#176`;
    document.getElementById("uvIndex").innerHTML = uvi;
    document.getElementById("visibility").innerHTML = `${Math.round(
      visibility / 1609.344
    )}mi`;
    document.getElementById("sunriseSunset").innerHTML = `${moment
      .unix(sunrise)
      .format("h:mm A")}|${moment.unix(sunset).format("h:mm A")}`;
    document.getElementById("cloudiness").innerHTML = `${clouds}%`;

    //FIlls air quality data for searched city
    const breezoURL = `https://api.breezometer.com/air-quality/v2/current-conditions?lat=${lat}&lon=${lon}&key=${breezoAPI}&features=breezometer_aqi,pollutants_aqi_information&metadata=true`;
    const breezoResponse = await fetch(breezoURL);
    const breezoData = await breezoResponse.json();
    const { aqi: breezoAQI } = breezoData.data.indexes.baqi;
    const { aqi: coAQI } = breezoData.data.pollutants.co.aqi_information.baqi;
    const { aqi: no2AQI } = breezoData.data.pollutants.no2.aqi_information.baqi;
    const { aqi: o3AQI } = breezoData.data.pollutants.o3.aqi_information.baqi;
    const { aqi: pm10AQI } =
      breezoData.data.pollutants.pm10.aqi_information.baqi;
    const { aqi: pm25AQI } =
      breezoData.data.pollutants.pm25.aqi_information.baqi;
    const { aqi: so2AQI } = breezoData.data.pollutants.so2.aqi_information.baqi;

    document.getElementById("currentAirQuality").innerHTML = breezoAQI;
    document.getElementById(
      "airQualityDesc"
    ).innerHTML = `This is considered ${airQualityDesc(breezoAQI)}`;
    document.getElementById("co").innerHTML = coAQI;
    document.getElementById("coDescription").innerHTML = airQualityDesc(coAQI);
    document.getElementById("no2").innerHTML = no2AQI;
    document.getElementById("no2Description").innerHTML =
      airQualityDesc(no2AQI);
    document.getElementById("o3").innerHTML = o3AQI;
    document.getElementById("o3Description").innerHTML = airQualityDesc(o3AQI);
    document.getElementById("pm10").innerHTML = pm10AQI;
    document.getElementById("pm10Description").innerHTML =
      airQualityDesc(pm10AQI);
    document.getElementById("pm25").innerHTML = pm25AQI;
    document.getElementById("pm25Description").innerHTML =
      airQualityDesc(pm25AQI);
    document.getElementById("so2").innerHTML = so2AQI;
    document.getElementById("so2Description").innerHTML =
      airQualityDesc(so2AQI);
  });
}

function emptySearch() {
  document.getElementById("autocomplete").value = "";
}
window.onload = emptySearch;
