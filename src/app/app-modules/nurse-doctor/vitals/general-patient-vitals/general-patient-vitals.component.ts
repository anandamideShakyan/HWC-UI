/*
 * AMRIT – Accessible Medical Records via Integrated Technology
 * Integrated EHR (Electronic Health Records) Solution
 *
 * Copyright (C) "Piramal Swasthya Management and Research Institute"
 *
 * This file is part of AMRIT.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see https://www.gnu.org/licenses/.
 */

import {
  Component,
  OnInit,
  Input,
  OnChanges,
  OnDestroy,
  DoCheck,
} from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ConfirmationService } from '../../../core/services/confirmation.service';
import { BeneficiaryDetailsService } from '../../../core/services/beneficiary-details.service';
import { NurseService, DoctorService } from '../../shared/services';
import { TestInVitalsService } from '../../shared/services/test-in-vitals.service';
import { AudioRecordingService } from '../../shared/services/audio-recording.service';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import { environment } from 'src/environments/environment';
import { IdrsscoreService } from '../../shared/services/idrsscore.service';
import { MatDialog } from '@angular/material/dialog';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { SetLanguageComponent } from 'src/app/app-modules/core/component/set-language.component';
import { IotcomponentComponent } from 'src/app/app-modules/core/component/iotcomponent/iotcomponent.component';

@Component({
  selector: 'app-nurse-general-patient-vitals',
  templateUrl: './general-patient-vitals.component.html',
  styleUrls: ['./general-patient-vitals.component.css'],
})
export class GeneralPatientVitalsComponent
  implements OnInit, OnChanges, OnDestroy, DoCheck
{
  @Input()
  patientVitalsForm!: FormGroup;

  @Input()
  mode!: string;

  @Input()
  vitalsMode!: string;

  @Input()
  visitCategory!: string;

  female: any;
  BMI: any;
  hideForANCAndQC = true;
  showGlucoseQC = false;

  startWeightTest = environment.startWeighturl;
  startTempTest = environment.startTempurl;
  startRBSTest = environment.startRBSurl;
  startPulseTest = environment.startPulseurl;
  startBPTest = environment.startBPurl;
  startBloodGlucose = environment.startBloodGlucoseurl;
  doctorScreen = false;
  male = false;
  IDRSWaistScore: any;
  ncdTemperature = false;
  currentLanguageSet: any;
  bmiStatusMinor: any;
  beneficiary: any;
  totalMonths = 12;
  benAge: any;
  rbsSelectedInInvestigation = false;
  rbsSelectedInInvestigationSubscription: any;
  diabetesSelected = 0;
  rbsPopup = false;
  rbsCheckBox = true;

  // Audio - SWAASA
  isRecording = false;
  recordedTime: any;
  blobUrl: any;
  teste: any;
  enableResult = false;
  enableSymptoms = false;
  frequentCough = false;
  sputum = false;
  coughAtNight = false;
  wheezing = false;
  painInChest = false;
  shortnessOfBreath = false;
  benGenderType: any;
  age: any;
  coughBlobFile: Blob = new Blob([]);
  severityValue: any;
  cough_pattern_Value: any;
  assessmentDetail: any;
  disabledLungAssesment = false;
  severity: any;
  cough_pattern: any;
  cough_severity_score: any;
  record_duration: any;
  frequentCoughChecked: any;
  sputumChecked: any;
  coughAtNightChecked: any;
  wheezingChecked: any;
  painInChestChecked: any;
  shortnessOfBreathChecked: any;
  enableLungAssessment = false;
  hideLungAssessment = false;

  constructor(
    private dialog: MatDialog,
    private confirmationService: ConfirmationService,
    private httpServiceService: HttpServiceService,
    private doctorService: DoctorService,
    private beneficiaryDetailsService: BeneficiaryDetailsService,
    private idrsscore: IdrsscoreService,
    private nurseService: NurseService,
    private audioRecordingService: AudioRecordingService,
    private testInVitalsService: TestInVitalsService,
    private sanitizer: DomSanitizer,
    private languageComponent: SetLanguageComponent,
  ) {
    this.audioRecordingService
      .recordingFailed()
      .subscribe(() => (this.isRecording = false));
    this.audioRecordingService.getRecordedTime().subscribe((time: any) => {
      this.recordedTime = time;
      if (this.recordedTime == '00:16') {
        this.stopRecording();
      }
    });
    this.audioRecordingService.getRecordedBlob().subscribe((data: any) => {
      this.teste = data;
      this.coughBlobFile = data.blob;
      this.blobUrl = URL.createObjectURL(data.blob);
    });
  }

  ngOnInit() {
    this.rbsPopup = false;
    this.rbsCheckBox = true;
    this.nurseService.clearRbsSelectedInInvestigation();
    this.idrsscore.clearDiabetesSelected();
    this.doctorService.setValueToEnableVitalsUpdateButton(false);
    this.fetchLanguageResponse();
    this.ncdTemperature = false;
    this.nurseService.clearMessage();
    this.nurseService.clearEnableLAssessment();
    this.nurseService.ncdTemp$.subscribe((response: any) =>
      response == undefined
        ? (this.ncdTemperature = false)
        : (this.ncdTemperature = response),
    );
    console.log('mode here', this.vitalsMode);
    console.log('mode here', this.mode);
    this.getBeneficiaryDetails();
    if (this.benAge < 18) {
      this.disabledLungAssesment = true;
    } else {
      this.disabledLungAssesment = false;
    }
    this.idrsscore.clearMessage();
    this.rbsSelectedInInvestigationSubscription =
      this.nurseService.rbsSelectedInInvestigation$.subscribe(
        (response: any) =>
          response == undefined
            ? (this.rbsSelectedInInvestigation = false)
            : (this.rbsSelectedInInvestigation = response),
      );
    this.idrsscore.diabetesSelectedFlag$.subscribe(
      (response: any) => (this.diabetesSelected = response),
    );
    this.getGender();
    if (environment.isMMUOfflineSync) {
      this.hideLungAssessment = true;
    } else {
      this.hideLungAssessment = false;
    }
    this.nurseService.enableLAssessment$.subscribe((response: any) => {
      if (response == true) {
        this.enableLungAssessment = true;
      } else {
        this.enableLungAssessment = false;
      }
    });
  }

  ngOnChanges() {
    console.log('mode here', this.vitalsMode);
    console.log('mode here', this.mode);
    const visitCategory1 = localStorage.getItem('visitCategory');
    console.log('page54' + visitCategory1);
    if (
      this.visitCategory == 'ANC' ||
      this.visitCategory == 'General OPD (QC)'
    ) {
      this.hideForANCAndQC = false;
    } else {
      this.hideForANCAndQC = true;
    }
    if (this.visitCategory == 'General OPD (QC)') {
      this.showGlucoseQC = true;
    } else {
      this.showGlucoseQC = false;
    }

    if (this.mode == 'view') {
      const visitID = localStorage.getItem('visitID');
      const benRegID = localStorage.getItem('beneficiaryRegID');
      this.getAssessmentID();
      this.doctorScreen = true;
      this.getGeneralVitalsData();
    }
    if (this.mode == 'update') {
      this.doctorScreen = true;
      this.updateGeneralVitals(this.patientVitalsForm);
    }
    console.log('doctorScreen', this.doctorScreen);
  }

  checkNurseRequirements(medicalForm: any) {
    const vitalsForm = this.patientVitalsForm;
    const required = [];
    if (
      this.enableLungAssessment === true &&
      this.benAge >= 18 &&
      this.nurseService.isAssessmentDone === false
    ) {
      required.push('Please perform Lung Assessment');
    }

    if (this.visitCategory == 'NCD screening') {
      if (vitalsForm.controls['height_cm'].errors) {
        required.push(
          this.currentLanguageSet.vitalsDetails.AnthropometryDataANC_OPD_NCD_PNC
            .height,
        );
      }
      if (vitalsForm.controls['weight_Kg'].errors) {
        required.push(
          this.currentLanguageSet.vitalsDetails.AnthropometryDataANC_OPD_NCD_PNC
            .weight,
        );
      }
      if (vitalsForm.controls['waistCircumference_cm'].errors) {
        required.push(
          this.currentLanguageSet.vitalsDetails.vitalsCancerscreening_QC
            .waistCircumference,
        );
      }
      if (vitalsForm.controls['temperature'].errors) {
        required.push(
          this.currentLanguageSet.vitalsDetails.vitalsDataANC_OPD_NCD_PNC
            .temperature,
        );
      }
      if (vitalsForm.controls['pulseRate'].errors) {
        required.push(
          this.currentLanguageSet.vitalsDetails.vitalsDataANC_OPD_NCD_PNC
            .pulseRate,
        );
      }
      if (vitalsForm.controls['systolicBP_1stReading'].errors) {
        required.push(
          this.currentLanguageSet.vitalsDetails.vitalsDataANC_OPD_NCD_PNC
            .systolicBP,
        );
      }
      if (vitalsForm.controls['diastolicBP_1stReading'].errors) {
        required.push(
          this.currentLanguageSet.vitalsDetails.vitalsDataANC_OPD_NCD_PNC
            .diastolicBP,
        );
      }
      if (vitalsForm.controls['rbsTestResult'].errors) {
        required.push(this.currentLanguageSet.rbsTestResult);
      }
    } else {
      if (this.visitCategory == 'ANC') {
        if (vitalsForm.controls['systolicBP_1stReading'].errors) {
          required.push(
            this.currentLanguageSet.vitalsDetails.vitalsDataANC_OPD_NCD_PNC
              .systolicBP,
          );
        }
        if (vitalsForm.controls['diastolicBP_1stReading'].errors) {
          required.push(
            this.currentLanguageSet.vitalsDetails.vitalsDataANC_OPD_NCD_PNC
              .diastolicBP,
          );
        }
      }
      if (vitalsForm.controls['height_cm'].errors) {
        required.push(
          this.currentLanguageSet.vitalsDetails.AnthropometryDataANC_OPD_NCD_PNC
            .height,
        );
      }
      if (vitalsForm.controls['weight_Kg'].errors) {
        required.push(
          this.currentLanguageSet.vitalsDetails.AnthropometryDataANC_OPD_NCD_PNC
            .weight,
        );
      }
      if (vitalsForm.controls['temperature'].errors) {
        required.push(
          this.currentLanguageSet.vitalsDetails.vitalsDataANC_OPD_NCD_PNC
            .temperature,
        );
      }
      if (vitalsForm.controls['pulseRate'].errors) {
        required.push(
          this.currentLanguageSet.vitalsDetails.vitalsDataANC_OPD_NCD_PNC
            .pulseRate,
        );
      }
    }

    if (required.length) {
      this.confirmationService.notify(
        this.currentLanguageSet.alerts.info.mandatoryFields,
        required,
      );
      return 0;
    } else {
      return 1;
    }
  }

  updateGeneralVitals(patientVitalsForm: any) {
    if (this.checkNurseRequirements(this.patientVitalsForm)) {
      this.doctorService
        .updateGeneralVitals(patientVitalsForm, this.visitCategory)
        .subscribe(
          (res: any) => {
            if (res.statusCode == 200 && res.data != null) {
              if (this.visitCategory == 'ANC') {
                this.getHRPDetails();
              }
              this.confirmationService.alert(res.data.response, 'success');
              this.doctorService.setValueToEnableVitalsUpdateButton(false);
              this.setRBSResultInReport(this.patientVitalsForm);
              this.patientVitalsForm.markAsPristine();
            } else {
              this.confirmationService.alert(res.errorMessage, 'error');
            }
          },
          (err: any) => {
            this.confirmationService.alert(err, 'error');
          },
        );
    }
  }

  setRBSResultInReport(patientVitalsForm: any) {
    if (patientVitalsForm.value) {
      const todayDate = new Date();

      if (
        !patientVitalsForm.controls['rbsTestResult'].disabled &&
        (patientVitalsForm.controls['rbsTestResult'].dirty ||
          patientVitalsForm.controls['rbsTestRemarks'].dirty)
      ) {
        const patientVitalsDataForReport = Object.assign(
          {},
          patientVitalsForm.getRawValue(),
          {
            createdDate: todayDate,
          },
        );

        this.testInVitalsService.setVitalsRBSValueInReportsInUpdate(
          patientVitalsDataForReport,
        );
      }
    }
  }

  generalVitalsDataSubscription: any;
  getGeneralVitalsData() {
    this.generalVitalsDataSubscription = this.doctorService
      .getGenericVitals({
        benRegID: localStorage.getItem('beneficiaryRegID'),
        benVisitID: localStorage.getItem('visitID'),
      })
      .subscribe((vitalsData: any) => {
        if (vitalsData) {
          const temp = Object.assign(
            {},
            vitalsData.data.benAnthropometryDetail,
            vitalsData.data.benPhysicalVitalDetail,
          );
          this.patientVitalsForm.patchValue(temp);
          if (temp.systolicBP_1stReading != null) {
            this.idrsscore.setSystolicBp(temp.systolicBP_1stReading);
          }
          if (temp.diastolicBP_1stReading != null) {
            this.idrsscore.setDiastolicBp(temp.diastolicBP_1stReading);
          }
          if (temp.waistCircumference_cm != null) {
            this.patchIDRSForWaist(temp.waistCircumference_cm);
          }
          this.nurseService.rbsTestResultFromDoctorFetch = null;
          if (temp.rbsTestResult != null) {
            this.nurseService.rbsTestResultFromDoctorFetch = temp.rbsTestResult;
            this.rbsResultChange();
          }
          if (
            this.patientVitalsForm.controls['hipCircumference_cm'].value &&
            this.patientVitalsForm.controls['hipCircumference_cm'].value !=
              null &&
            this.visitCategory == 'General OPD'
          ) {
            this.checkHip(
              this.patientVitalsForm.controls['hipCircumference_cm'].value,
            );
          }
          if (
            this.patientVitalsForm.controls['waistHipRatio'].value &&
            this.patientVitalsForm.controls['waistHipRatio'].value != null &&
            this.visitCategory == 'General OPD'
          ) {
            this.hipWaistRatio();
          }
          this.calculateBMI();

          //Sending RBS Test Result to patch in Lab Reports

          if (vitalsData.benPhysicalVitalDetail) {
            this.testInVitalsService.setVitalsRBSValueInReports(
              vitalsData.benPhysicalVitalDetail,
            );
          }
        }
      });
  }

  ngOnDestroy() {
    if (this.beneficiaryDetailSubscription)
      this.beneficiaryDetailSubscription.unsubscribe();
    if (this.generalVitalsDataSubscription)
      this.generalVitalsDataSubscription.unsubscribe();
    if (this.rbsSelectedInInvestigationSubscription)
      this.rbsSelectedInInvestigationSubscription.unsubscribe();
    this.nurseService.rbsTestResultFromDoctorFetch = null;
    this.nurseService.isAssessmentDone = false;
  }
  checkDiasableRBS() {
    if (
      this.rbsSelectedInInvestigation === true ||
      (this.nurseService.rbsTestResultFromDoctorFetch != undefined &&
        this.nurseService.rbsTestResultFromDoctorFetch != null)
    )
      return true;

    return false;
  }
  benGenderAndAge: any;
  beneficiaryDetailSubscription: any;
  getBeneficiaryDetails() {
    this.beneficiaryDetailSubscription =
      this.beneficiaryDetailsService.beneficiaryDetails$.subscribe(
        (beneficiary) => {
          if (beneficiary) {
            if (
              beneficiary &&
              beneficiary.ageVal != null &&
              beneficiary.ageVal != undefined
            ) {
              this.benGenderAndAge = beneficiary;
              this.benAge = beneficiary.ageVal;
              if (this.benAge >= 18) {
                this.disabledLungAssesment = false;
              } else {
                this.disabledLungAssesment = true;
              }
              const ageMonth = this.benGenderAndAge.age;
              const ar = ageMonth.split(' ');
              this.totalMonths = Number(ar[0] * 12) + Number(ar[3]);
            }
            if (
              beneficiary != undefined &&
              beneficiary.genderName != undefined &&
              beneficiary.genderName != null &&
              beneficiary.genderName &&
              beneficiary.genderName.toLowerCase() == 'female'
            ) {
              this.female = true;
            }
            if (
              beneficiary != undefined &&
              beneficiary.genderName != undefined &&
              beneficiary.genderName != null &&
              beneficiary.genderName &&
              beneficiary.genderName.toLowerCase() == 'male'
            ) {
              this.male = true;
            }
          }
        },
      );
  }

  normalBMI = true;
  calculateBMI() {
    if (
      this.height_cm &&
      this.height_cm != null &&
      this.weight_Kg &&
      this.weight_Kg != null
    ) {
      this.BMI = (this.weight_Kg / (this.height_cm * this.height_cm)) * 10000;
      this.BMI = +this.BMI.toFixed(1);
      this.patientVitalsForm.patchValue({ bMI: this.BMI });
    } else {
      this.patientVitalsForm.patchValue({ bMI: null });
    }
    if (
      this.benGenderAndAge != undefined &&
      this.benGenderAndAge.age != undefined
    ) {
      const ageMonth = this.benGenderAndAge.age;
      const ar = ageMonth.split(' ');
      this.totalMonths = Number(ar[0] * 12) + Number(ar[3]);
    }
    if (
      this.totalMonths > 60 &&
      this.totalMonths <= 228 &&
      (this.benGenderAndAge.genderName.toLowerCase() == 'male' ||
        this.benGenderAndAge.genderName.toLowerCase() == 'female')
    ) {
      this.nurseService
        .calculateBmiStatus({
          yearMonth: this.benGenderAndAge.age,
          gender: this.benGenderAndAge.genderName,
          bmi: this.BMI,
        })
        .subscribe(
          (res: any) => {
            if (res.statusCode == 200 && res.data != null) {
              const bmiData = res.data;
              if (bmiData.bmiStatus != undefined && bmiData.bmiStatus != null) {
                this.bmiStatusMinor = bmiData.bmiStatus.toLowerCase();
                if (this.bmiStatusMinor === 'normal') this.normalBMI = true;
                else this.normalBMI = false;
              }
            } else {
              this.confirmationService.alert(res.errorMessage, 'error');
            }
          },
          (err: any) => {
            this.confirmationService.alert(err, 'error');
          },
        );
    } else {
      if (this.BMI >= 18.5 && this.BMI <= 24.9) this.normalBMI = true;
      else this.normalBMI = false;
    }
  }

  checkHeight(height_cm: any) {
    if (this.height_cm < 10 || this.height_cm > 200) {
      this.confirmationService.alert(
        this.currentLanguageSet.alerts.info.recheckValue,
      );
    }
  }

  checkWeight(weight_Kg: any) {
    if (this.weight_Kg < 25 || this.weight_Kg > 150) {
      this.confirmationService.alert(
        this.currentLanguageSet.alerts.info.recheckValue,
      );
    }
  }

  normalWaistHipRatio = true;
  hipWaistRatio() {
    let waistHipRatio: any;
    if (
      this.hipCircumference_cm &&
      this.waistCircumference_cm &&
      this.hipCircumference_cm != null &&
      this.waistCircumference_cm != null
    ) {
      waistHipRatio = (
        this.waistCircumference_cm / this.hipCircumference_cm
      ).toFixed(2);
      this.patientVitalsForm.patchValue({ waistHipRatio: waistHipRatio });
      if (this.female) {
        this.normalWaistHipRatio = waistHipRatio < 0.81 ? true : false;
      } else this.normalWaistHipRatio = waistHipRatio < 0.91 ? true : false;
    } else {
      this.patientVitalsForm.patchValue({ waistHipRatio: null });
    }
  }

  get waistHipRatio() {
    return this.patientVitalsForm.controls['waistHipRatio'].value;
  }

  normalHip = true;
  checkHip(hipCircumference_cm: any) {
    if (this.female)
      this.normalHip =
        this.hipCircumference_cm >= 97 && this.hipCircumference_cm <= 108
          ? true
          : false;
    else
      this.normalHip =
        this.hipCircumference_cm >= 94 && this.hipCircumference_cm <= 105
          ? true
          : false;
  }

  checkHeadCircumference(headCircumference_cm: any) {
    if (this.headCircumference_cm <= 25 || this.headCircumference_cm >= 75) {
      this.confirmationService.alert(
        this.currentLanguageSet.alerts.info.recheckValue,
      );
    }
  }

  checkMidUpperArmCircumference(midUpperArmCircumference_MUAC_cm: any) {
    if (
      this.midUpperArmCircumference_MUAC_cm <= 6 ||
      this.midUpperArmCircumference_MUAC_cm >= 30
    ) {
      this.confirmationService.alert(
        this.currentLanguageSet.alerts.info.recheckValue,
      );
    }
  }

  checkTemperature(temperature: any) {
    if (this.temperature <= 90 || this.temperature >= 110) {
      this.confirmationService.alert(
        this.currentLanguageSet.alerts.info.recheckValue,
      );
    }
  }

  checkPulseRate(pulseRate: any) {
    if (this.pulseRate <= 50 || this.pulseRate >= 200) {
      this.confirmationService.alert(
        this.currentLanguageSet.alerts.info.recheckValue,
      );
    }
  }
  checkSpo2() {
    if (this.sPO2 < 1 || this.sPO2 > 100) {
      this.confirmationService.alert(
        this.currentLanguageSet.alerts.info.recheckValue,
      );
    }
  }
  checkRespiratoryRate(respiratoryRate: any) {
    if (this.respiratoryRate <= 10 || this.respiratoryRate >= 100) {
      this.confirmationService.alert(
        this.currentLanguageSet.alerts.info.recheckValue,
      );
    }
  }

  checkSystolic(systolicBP: any) {
    if (systolicBP <= 40 || systolicBP >= 320) {
      this.confirmationService.alert(
        this.currentLanguageSet.alerts.info.recheckValue,
      );
    }
    if (systolicBP != null) this.idrsscore.setSystolicBp(systolicBP);
    else this.idrsscore.setSystolicBp(0);
  }

  checkSystolicGreater(systolic: any, diastolic: any) {
    if (systolic && diastolic && parseInt(systolic) <= parseInt(diastolic)) {
      this.confirmationService.alert(this.currentLanguageSet.alerts.info.sysBp);
      this.patientVitalsForm.patchValue({
        systolicBP_1stReading: null,
      });
    }
  }

  checkDiastolicLower(systolic: any, diastolic: any) {
    if (systolic && diastolic && parseInt(diastolic) >= parseInt(systolic)) {
      this.confirmationService.alert(this.currentLanguageSet.alerts.info.diaBp);
      this.patientVitalsForm.patchValue({
        diastolicBP_1stReading: null,
      });
    }
  }

  checkDiastolic(diastolicBP: any) {
    if (diastolicBP <= 10 || diastolicBP >= 180) {
      this.confirmationService.alert(
        this.currentLanguageSet.alerts.info.recheckValue,
      );
    }
    if (diastolicBP != null) this.idrsscore.setDiastolicBp(diastolicBP);
    else this.idrsscore.setDiastolicBp(0);
  }

  checkBloodSugarFasting(bloodSugarFasting: any) {
    if (bloodSugarFasting < 50 || bloodSugarFasting > 700) {
      this.confirmationService.alert(
        this.currentLanguageSet.alerts.info.recheckValue,
      );
    }
  }

  checkBloodSugarRandom(bloodSugarRandom: any) {
    if (bloodSugarRandom < 50 || bloodSugarRandom > 700) {
      this.confirmationService.alert(
        this.currentLanguageSet.alerts.info.recheckValue,
      );
    }
  }

  checkBloodSugar2HrPostPrandial(bloodSugar2HrPostPrandial: any) {
    if (bloodSugar2HrPostPrandial < 50 || bloodSugar2HrPostPrandial > 700) {
      this.confirmationService.alert(
        this.currentLanguageSet.alerts.info.recheckValue,
      );
    }
  }
  checkForRange() {
    if (
      this.rbsTestResult < 0 ||
      (this.rbsTestResult > 1000 && !this.rbsPopup)
    ) {
      this.confirmationService.alert(
        this.currentLanguageSet.alerts.info.recheckValue,
      );
    }
  }
  get height_cm() {
    return this.patientVitalsForm.controls['height_cm'].value;
  }

  get weight_Kg() {
    return this.patientVitalsForm.controls['weight_Kg'].value;
  }

  get waistCircumference_cm() {
    return this.patientVitalsForm.controls['waistCircumference_cm'].value;
  }

  get hipCircumference_cm() {
    return this.patientVitalsForm.controls['hipCircumference_cm'].value;
  }

  get midUpperArmCircumference_MUAC_cm() {
    return this.patientVitalsForm.controls['midUpperArmCircumference_MUAC_cm']
      .value;
  }

  get headCircumference_cm() {
    return this.patientVitalsForm.controls['headCircumference_cm'].value;
  }

  get temperature() {
    return this.patientVitalsForm.controls['temperature'].value;
  }

  get pulseRate() {
    return this.patientVitalsForm.controls['pulseRate'].value;
  }

  get systolicBP_1stReading() {
    return this.patientVitalsForm.controls['systolicBP_1stReading'].value;
  }

  get diastolicBP_1stReading() {
    return this.patientVitalsForm.controls['diastolicBP_1stReading'].value;
  }

  get respiratoryRate() {
    return this.patientVitalsForm.controls['respiratoryRate'].value;
  }

  get bMI() {
    return this.patientVitalsForm.controls['bMI'].value;
  }

  get bloodGlucose_Fasting() {
    return this.patientVitalsForm.controls['bloodGlucose_Fasting'].value;
  }

  get bloodGlucose_Random() {
    return this.patientVitalsForm.controls['bloodGlucose_Random'].value;
  }

  get bloodGlucose_2hr_PP() {
    return this.patientVitalsForm.controls['bloodGlucose_2hr_PP'].value;
  }
  get sPO2() {
    return this.patientVitalsForm.controls['sPO2'].value;
  }

  get rbsTestResult() {
    return this.patientVitalsForm.controls['rbsTestResult'].value;
  }
  openIOTWeightModel() {
    const dialogRef = this.dialog.open(IotcomponentComponent, {
      width: '600px',
      height: '180px',
      disableClose: true,
      data: { startAPI: this.startWeightTest },
    });
    dialogRef.afterClosed().subscribe((result) => {
      console.log('he;;p', result, result['result']);
      if (result != null) {
        this.patientVitalsForm.patchValue({
          weight_Kg: result['result'],
        });
        this.doctorService.setValueToEnableVitalsUpdateButton(true);
        this.calculateBMI();
      }
    });
  }

  openIOTRBSModel() {
    this.rbsPopup = true;
    const dialogRef = this.dialog.open(IotcomponentComponent, {
      width: '600px',
      height: '180px',
      disableClose: true,
      data: { startAPI: this.startRBSTest },
    });
    dialogRef.afterClosed().subscribe((result) => {
      this.rbsPopup = false;
      if (result != null) {
        this.patientVitalsForm.patchValue({
          rbsTestResult: result['result'],
        });
        this.patientVitalsForm.controls['rbsTestResult'].markAsDirty();
        this.doctorService.setValueToEnableVitalsUpdateButton(true);
        if (
          this.patientVitalsForm.controls['rbsTestResult'].value &&
          this.patientVitalsForm.controls['rbsTestResult'].value != null
        ) {
          this.nurseService.setRbsInCurrentVitals(
            this.patientVitalsForm.controls['rbsTestResult'].value,
          );
        }
      }
    });
  }

  rbsResultChange(): boolean {
    if (
      this.patientVitalsForm.controls['rbsTestResult'].value &&
      this.patientVitalsForm.controls['rbsTestResult'].value != null
    ) {
      this.nurseService.setRbsInCurrentVitals(
        this.patientVitalsForm.controls['rbsTestResult'].value,
      );
    } else {
      this.nurseService.setRbsInCurrentVitals(null);
    }
    if (
      this.rbsSelectedInInvestigation === true ||
      (this.nurseService.rbsTestResultFromDoctorFetch != undefined &&
        this.nurseService.rbsTestResultFromDoctorFetch != null)
    ) {
      this.patientVitalsForm.controls['rbsTestResult'].disable();
      this.patientVitalsForm.controls['rbsTestRemarks'].disable();
      this.patientVitalsForm.controls['rbsCheckBox'].disable();
      return true; // disable the controls
    } else {
      this.patientVitalsForm.controls['rbsTestResult'].enable();
      this.patientVitalsForm.controls['rbsTestRemarks'].enable();
      this.patientVitalsForm.controls['rbsCheckBox'].enable();
      return false; // enable the controls
    }
  }
  openIOTTempModel() {
    const dialogRef = this.dialog.open(IotcomponentComponent, {
      width: '600px',
      height: '180px',
      disableClose: true,
      data: { startAPI: this.startTempTest },
    });
    dialogRef.afterClosed().subscribe((result) => {
      console.log('temperature', result, result['temperature']);
      if (result != null) {
        this.patientVitalsForm.patchValue({
          temperature: result['temperature'],
        });
        this.doctorService.setValueToEnableVitalsUpdateButton(true);
      }
    });
  }
  openIOTPulseRateModel() {
    const dialogRef = this.dialog.open(IotcomponentComponent, {
      width: '600px',
      height: '180px',
      disableClose: true,
      data: { startAPI: this.startPulseTest },
    });
    dialogRef.afterClosed().subscribe((result) => {
      console.log('pulse_oxymetery', result, result['pulseRate']);
      if (result != null) {
        this.patientVitalsForm.patchValue({
          pulseRate: result['pulseRate'],
        });
        this.doctorService.setValueToEnableVitalsUpdateButton(true);
      }
    });
  }
  openIOTSPO2Model() {
    const dialogRef = this.dialog.open(IotcomponentComponent, {
      width: '600px',
      height: '180px',
      disableClose: true,
      data: { startAPI: this.startPulseTest },
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result != null) {
        this.patientVitalsForm.patchValue({
          sPO2: result['spo2'],
        });
        this.doctorService.setValueToEnableVitalsUpdateButton(true);
      }
    });
  }

  openIOTBPModel() {
    const dialogRef = this.dialog.open(IotcomponentComponent, {
      width: '600px',
      height: '180px',
      disableClose: true,
      data: { startAPI: this.startBPTest },
    });
    dialogRef.afterClosed().subscribe((result) => {
      console.log('blood_pressure', result['sys'], result['dia']);
      if (result != null) {
        this.patientVitalsForm.patchValue({
          systolicBP_1stReading: result['sys'],
          diastolicBP_1stReading: result['dia'],
        });
        this.doctorService.setValueToEnableVitalsUpdateButton(true);
      }
    });
  }
  openIOTBGFastingModel() {
    const dialogRef = this.dialog.open(IotcomponentComponent, {
      width: '600px',
      height: '180px',
      disableClose: true,
      data: { startAPI: this.startBloodGlucose },
    });
    dialogRef.afterClosed().subscribe((result) => {
      console.log('blood_pressure', result['sys'], result['dia']);
      if (result != null) {
        this.patientVitalsForm.patchValue({
          bloodGlucose_Fasting: result['result'],
        });
        this.doctorService.setValueToEnableVitalsUpdateButton(true);
      }
    });
  }
  openIOTBGRandomModel() {
    const dialogRef = this.dialog.open(IotcomponentComponent, {
      width: '600px',
      height: '180px',
      disableClose: true,
      data: { startAPI: this.startBloodGlucose },
    });
    dialogRef.afterClosed().subscribe((result) => {
      console.log('blood_pressure', result['sys'], result['dia']);
      if (result != null) {
        this.patientVitalsForm.patchValue({
          bloodGlucose_Random: result['result'],
        });
        this.doctorService.setValueToEnableVitalsUpdateButton(true);
      }
    });
  }
  openIOTBGPostPrandialModel() {
    const dialogRef = this.dialog.open(IotcomponentComponent, {
      width: '600px',
      height: '180px',
      disableClose: true,
      data: { startAPI: this.startBloodGlucose },
    });
    dialogRef.afterClosed().subscribe((result) => {
      console.log('blood_pressure', result['sys'], result['dia']);
      if (result != null) {
        this.patientVitalsForm.patchValue({
          bloodGlucose_2hr_PP: result['result'],
        });
        this.doctorService.setValueToEnableVitalsUpdateButton(true);
      }
    });
  }

  checkIDRSForWaist(waistValue: any) {
    if (this.male) {
      if (waistValue < 90) {
        this.IDRSWaistScore = 0;
      }
      if (waistValue >= 90 && waistValue <= 99) {
        this.IDRSWaistScore = 10;
      }
      if (waistValue >= 100) {
        this.IDRSWaistScore = 20;
      }
    } else if (this.female) {
      if (waistValue < 80) {
        this.IDRSWaistScore = 0;
      }
      if (waistValue >= 80 && waistValue <= 89) {
        this.IDRSWaistScore = 10;
      }
      if (waistValue >= 90) {
        this.IDRSWaistScore = 20;
      }
    }
    localStorage.setItem('waistIDRSScore', this.IDRSWaistScore);
    this.idrsscore.setIDRSScoreWaist(this.IDRSWaistScore);
    this.idrsscore.setIDRSScoreFlag();
  }
  patchIDRSForWaist(waistValue: any) {
    if (this.male) {
      if (waistValue < 90) {
        this.IDRSWaistScore = 0;
      }
      if (waistValue >= 90 && waistValue <= 99) {
        this.IDRSWaistScore = 10;
      }
      if (waistValue >= 100) {
        this.IDRSWaistScore = 20;
      }
    } else if (this.female) {
      if (waistValue < 80) {
        this.IDRSWaistScore = 0;
      }
      if (waistValue >= 80 && waistValue <= 89) {
        this.IDRSWaistScore = 10;
      }
      if (waistValue >= 90) {
        this.IDRSWaistScore = 20;
      }
    }
    this.idrsscore.setIDRSScoreWaist(this.IDRSWaistScore);
  }

  getHRPDetails() {
    const beneficiaryRegID = localStorage.getItem('beneficiaryRegID');
    const visitCode = localStorage.getItem('visitCode');
    this.doctorService
      .getHRPDetails(beneficiaryRegID, visitCode)
      .subscribe((res: any) => {
        if (res && res.statusCode == 200 && res.data) {
          if (res.data.isHRP == true) {
            this.beneficiaryDetailsService.setHRPPositive();
          } else {
            this.beneficiaryDetailsService.resetHRPPositive();
          }
        }
      });
  }

  //AN40085822 13/10/2021 Integrating Multilingual Functionality --Start--
  ngDoCheck() {
    this.fetchLanguageResponse();
  }

  fetchLanguageResponse() {
    this.languageComponent = new SetLanguageComponent(this.httpServiceService);
    this.languageComponent.setLanguage();
    this.currentLanguageSet = this.languageComponent.currentLanguageObject;
  }

  onRbsCheckBox(event: any) {
    if (event.checked) {
      this.rbsCheckBox = true;
    } else {
      this.rbsCheckBox = false;
    }
  }

  startRecording() {
    if (!this.isRecording) {
      this.isRecording = true;
      this.audioRecordingService.startRecording();
    }
  }

  abortRecording() {
    if (this.isRecording) {
      this.isRecording = false;
      this.audioRecordingService.abortRecording();
    }
  }

  stopRecording() {
    if (this.isRecording) {
      this.audioRecordingService.stopRecording();
      this.isRecording = false;
    }
  }

  clearRecordedData() {
    this.confirmationService
      .confirm(`info`, 'Do you really want to clear the recording?')
      .subscribe((res) => {
        if (res) {
          this.blobUrl = null;
          this.coughBlobFile = new Blob([]);
          this.frequentCough = false;
          this.sputum = false;
          this.coughAtNight = false;
          this.wheezing = false;
          this.painInChest = false;
          this.shortnessOfBreath = false;
          this.enableResult = false;
          this.nurseService.isAssessmentDone = false;
        }
      });
  }

  getGender() {
    const gender = localStorage.getItem('beneficiaryGender');
    if (gender === 'Female') this.benGenderType = 1;
    else if (gender === 'Male') this.benGenderType = 0;
    else if (gender === 'Transgender') this.benGenderType = 2;
  }

  onCheckboxChange(symptomName: any, event: any) {
    symptomName = event.checked ? 1 : 0;
  }

  startAssessment() {
    const symptoms = {
      frequent_cough: this.frequentCough ? 1 : 0,
      sputum: this.sputum ? 1 : 0,
      cough_at_night: this.coughAtNight ? 1 : 0,
      wheezing: this.wheezing ? 1 : 0,
      pain_in_chest: this.painInChest ? 1 : 0,
      shortness_of_breath: this.shortnessOfBreath ? 1 : 0,
    };
    const reqObj = {
      coughsoundfile: null,
      gender: this.benGenderType,
      age: this.benAge,
      patientId: localStorage.getItem('beneficiaryRegID'),
      assessmentId: null,
      providerServiceMapID: localStorage.getItem('providerServiceID'),
      createdBy: localStorage.getItem('userName'),
      symptoms: symptoms,
    };
    const file = new File([this.coughBlobFile], 'coughSound.wav');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('request', JSON.stringify(reqObj));
    console.log('reqObjFile', formData.get('file'));
    this.audioRecordingService.getResultStatus(formData).subscribe(
      (res: any) => {
        if (res.statusCode == 200 && res.data !== null) {
          this.severity = res.data.severity;
          this.cough_pattern = res.data.cough_pattern;
          this.cough_severity_score = res.data.cough_severity_score;
          this.record_duration = res.data.record_duration;
          this.nurseService.setEnableLAssessment(false);
          this.enableResult = true;
          this.nurseService.isAssessmentDone = true;
          console.log('Cough Result Data', res.data);
        } else {
          this.confirmationService.alert(res.errorMessage, 'error');
        }
      },
      (err: any) => {
        this.confirmationService.alert(err, 'error');
      },
    );
    console.log('reqObj', reqObj);
  }

  getAssessmentID() {
    const benRegID = localStorage.getItem('beneficiaryRegID');
    this.doctorService.getAssessment(benRegID).subscribe((res: any) => {
      if (res.statusCode == 200 && res.data !== null && res.data.length > 0) {
        const lastElementIndex = res.data.length - 1;
        const lastElementData = res.data[lastElementIndex];
        const assessmentId = lastElementData.assessmentId;
        if (assessmentId !== null && assessmentId !== undefined) {
          this.getAssessmentDetails(assessmentId);
        }
      }
    });
  }

  getAssessmentDetails(assessmentId: any) {
    this.doctorService.getAssessmentDet(assessmentId).subscribe((res: any) => {
      if (res.statusCode === 200 && res.data !== null) {
        this.severity = res.data.severity;
        this.cough_pattern = res.data.cough_pattern;
        this.cough_severity_score = res.data.cough_severity_score;
        this.record_duration = res.data.record_duration;
        this.nurseService.setEnableLAssessment(false);
        this.enableResult = true;
        this.nurseService.isAssessmentDone = true;
      }
    });
  }

  //--End--
}
