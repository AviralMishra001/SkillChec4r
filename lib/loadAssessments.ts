//import fs from "fs";
//import path from "path";
//import csv from "csv-parser";

//export type Assessment = {
  //"Assessment Name": string;
//  "Test Type": string;
//  "Duration": string;
  //"Remote Testing": string;
  //"Adaptive/IRT": string;
//  "Description": string;
  //"URL": string;
//};

//export function loadAssessments(): Promise<Assessment[]> {
  //return new Promise((resolve) => {
    //const results: Assessment[] = [];
    //const filePath = path.join(process.cwd(), "data", "shl.csv");

    //fs.createReadStream(filePath)
      //.pipe(csv())
      //.on("data", (data) => results.push(data))
      //.on("end", () => resolve(results));
  //});
//}
