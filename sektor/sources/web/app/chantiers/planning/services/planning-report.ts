export interface ReportRequest {sourceWeek:string;targetWeek:string;activityIds:string[];remaining?:Record<string,{statusDate:string;minutes:number}>;}
export interface ReportPreview {
  token:string;request:ReportRequest;finish:string;
  changes:{id:string;label:string;previousStart:string;previousFinish:string;start:string;finish:string;critical:boolean;workStart?:string}[];
  weeks:{start:string;status:string;revision:number}[];checks:string[];
}
export interface PlanningReport {
  id:string;version:number;status:string;proposedBy:string;proposedAt:string;reason:string;preview:ReportPreview;
  decidedBy:string|null;decidedAt:string|null;decisionNote:string|null;canDecide:boolean;canCancel:boolean;
}
