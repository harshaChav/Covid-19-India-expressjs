const express = require("express");
const app = express();
const path = require("path");
const dbPath = path.join(__dirname, "covid19India.db");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

app.use(express.json());

//initializeDbAndServer

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server running at http://localhost/3000/");
    });
  } catch (e) {
    console.log(`Db Error:${e.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const convertStatesObjToResponseObj = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};

const convertStatesNameObjToResponseObj = (dbObject) => {
  return {
    stateName: dbObject.state_name,
  };
};

const convertDistrictObjToResponseObj = (dbObject) => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};

//API1
app.get("/states/", async (request, response) => {
  const getStatesQuery = `select * from state;`;
  const statesList = await database.all(getStatesQuery);
  response.send(
    statesList.map((eachState) => convertStatesObjToResponseObj(eachState))
  );
});
module.exports = app;

//API2
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `select * from state where state_id=${stateId};`;
  const stateList = await database.get(getStateQuery);
  response.send(convertStatesObjToResponseObj(stateList));
});

//API3

app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const addDistrictQuery = `insert into district(district_name,state_id,cases,cured,active,deaths) 
  values('${districtName}',${stateId},${cases},${cured},${active},${deaths});`;
  const districtDetails = await database.run(addDistrictQuery);
  response.send("District Successfully Added");
});

//API4
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getdistrictQuery = `select * from district where district_id=${districtId};`;
  const districtList = await database.get(getdistrictQuery);
  response.send(convertDistrictObjToResponseObj(districtList));
});

//API5
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deletedistrictQuery = `delete from district where district_id=${districtId};`;
  await database.run(deletedistrictQuery);
  response.send("District Removed");
});

//API6
app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const updateDistrictDetails = `update district set 
  district_name='${districtName}',
  state_id=${stateId},
  cases=${cases},
  cured=${cured},
  active=${active},
  deaths=${deaths};`;
  const districtDetails = await database.run(updateDistrictDetails);
  response.send("District Details Updated");
});

//API7
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStateStatsQuery = `
    SELECT
      SUM(cases),
      SUM(cured),
      SUM(active),
      SUM(deaths)
    FROM
      district
    WHERE
      state_id=${stateId};`;
  const stats = await database.get(getStateStatsQuery);
  response.send({
    totalCases: stats["SUM(cases)"],
    totalCured: stats["SUM(cured)"],
    totalActive: stats["SUM(active)"],
    totalDeaths: stats["SUM(deaths)"],
  });
});

//API8
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getStateNameQuery = `
    SELECT
      state_name
    FROM
      district
    NATURAL JOIN
      state
    WHERE 
      district_id=${districtId};`;
  const state = await database.get(getStateNameQuery);
  response.send({ stateName: state.state_name });
});

module.exports = app;
