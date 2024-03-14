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

import { Component, OnInit, Input, DoCheck, OnDestroy } from '@angular/core';
import { FormGroup } from '@angular/forms';

import { PreviousDetailsComponent } from '../../../../core/components/previous-details/previous-details.component';
import {
  MasterdataService,
  NurseService,
  DoctorService,
} from '../../../shared/services';
import { ConfirmationService } from '../../../../core/services/confirmation.service';
import { MatDialog } from '@angular/material/dialog';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';

@Component({
  selector: 'app-general-menstrual-history',
  templateUrl: './menstrual-history.component.html',
  styleUrls: ['./menstrual-history.component.css'],
})
export class MenstrualHistoryComponent implements OnInit, DoCheck, OnDestroy {
  @Input()
  menstrualHistoryForm!: FormGroup;

  @Input()
  mode!: string;

  @Input()
  visitCategory: any;

  menstrualHistoryData: any;
  masterData: any;
  today: any;
  minimumLMPDate: any;
  currentLanguageSet: any;

  constructor(
    private dialog: MatDialog,
    private nurseService: NurseService,
    private doctorService: DoctorService,
    private confirmationService: ConfirmationService,
    private masterdataService: MasterdataService,
    public httpServiceService: HttpServiceService,
  ) {}

  ngOnInit() {
    this.assignSelectedLanguage();
    this.getMasterData();
    this.today = new Date();
    this.minimumLMPDate = new Date(
      this.today.getTime() - 365 * 24 * 60 * 60 * 1000,
    );
  }

  ngDoCheck() {
    this.assignSelectedLanguage();
  }
  assignSelectedLanguage() {
    const getLanguageJson = new SetLanguageComponent(this.httpServiceService);
    getLanguageJson.setLanguage();
    this.currentLanguageSet = getLanguageJson.currentLanguageObject;
  }

  ngOnDestroy() {
    if (this.nurseMasterDataSubscription)
      this.nurseMasterDataSubscription.unsubscribe();

    if (this.generalHistorySubscription)
      this.generalHistorySubscription.unsubscribe();
  }

  nurseMasterDataSubscription: any;
  getMasterData() {
    this.nurseMasterDataSubscription =
      this.masterdataService.nurseMasterData$.subscribe((masterData) => {
        if (
          masterData &&
          masterData.menstrualCycleStatus &&
          masterData.menstrualCycleLengths &&
          masterData.menstrualCycleBloodFlowDuration &&
          masterData.menstrualProblem
        ) {
          this.masterData = masterData;
          this.checkvisitCategory();
          if (this.mode == 'view') {
            const visitID = localStorage.getItem('visitID');
            const benRegID = localStorage.getItem('beneficiaryRegID');
            this.getGeneralHistory(benRegID, visitID);
          }
        }
      });
  }

  checkvisitCategory() {
    if (this.visitCategory == 'ANC') {
      let temp = 'Amenorrhea';
      temp = this.masterData.menstrualCycleStatus.filter((item: any) => {
        return item.name == temp;
      })[0];
      this.menstrualHistoryForm.patchValue({ menstrualCycleStatus: temp });
    }
  }

  generalHistorySubscription: any;
  getGeneralHistory(benRegID: any, visitID: any) {
    this.generalHistorySubscription = this.doctorService
      .getGeneralHistoryDetails(benRegID, visitID)
      .subscribe((history: any) => {
        if (
          history != null &&
          history.statusCode == 200 &&
          history.data != null &&
          history.data.MenstrualHistory
        ) {
          const temp = history.data.MenstrualHistory;
          console.log('history.data.MenstrualHistory', temp);

          temp.menstrualCycleStatus =
            this.masterData.menstrualCycleStatus.filter((item: any) => {
              return item.name == temp.menstrualCycleStatus;
            })[0];
          temp.cycleLength = this.masterData.menstrualCycleLengths.filter(
            (item: any) => {
              return item.menstrualCycleRange == temp.cycleLength;
            },
          )[0];
          temp.bloodFlowDuration =
            this.masterData.menstrualCycleBloodFlowDuration.filter(
              (item: any) => {
                return item.menstrualCycleRange == temp.bloodFlowDuration;
              },
            )[0];
          const tempMenstrualProblem: any = [];
          if (
            temp.menstrualProblemList &&
            temp.menstrualProblemList.length > 0
          ) {
            this.masterData.menstrualProblem.forEach(
              (menstrualProblem: any) => {
                temp.menstrualProblemList.forEach(
                  (menstrualProblemValue: any) => {
                    if (
                      menstrualProblem.problemName ==
                      menstrualProblemValue.problemName
                    ) {
                      tempMenstrualProblem.push(menstrualProblem);
                    }
                  },
                );
              },
            );
          }

          temp.menstrualProblemList = tempMenstrualProblem.slice();
          temp.lMPDate = new Date(temp.lMPDate);

          this.menstrualHistoryForm.patchValue(temp);
        }
      });
  }

  getPreviousMenstrualHistory() {
    const benRegID: any = localStorage.getItem('beneficiaryRegID');
    this.nurseService
      .getPreviousMenstrualHistory(benRegID, this.visitCategory)
      .subscribe(
        (res: any) => {
          if (res.statusCode == 200 && res.data != null) {
            if (res.data.data.length > 0) {
              this.viewPreviousData(res.data);
            } else {
              this.confirmationService.alert(
                this.currentLanguageSet.alerts.info.pastHistoryNot,
              );
            }
          } else {
            this.confirmationService.alert(
              this.currentLanguageSet.alerts.info.errorFetchingHistory,
              'error',
            );
          }
        },
        (err) => {
          this.confirmationService.alert(
            this.currentLanguageSet.alerts.info.errorFetchingHistory,
            'error',
          );
        },
      );
  }

  viewPreviousData(data: any) {
    this.dialog.open(PreviousDetailsComponent, {
      data: {
        dataList: data,
        title:
          this.currentLanguageSet.historyData.Previousmenstrualhistory
            .previousmenstrualhistory,
      },
    });
  }

  get menstrualCycleStatus() {
    return this.menstrualHistoryForm?.controls['menstrualCycleStatus'].value;
  }

  get lMPDate() {
    return this.menstrualHistoryForm.controls['lMPDate'].value;
  }
  checkMenstrualCycleStatus() {
    console.log('here in to check');

    if (this.visitCategory == 'ANC') {
      this.menstrualHistoryForm.patchValue({
        menstrualCycleStatusID: null,
        regularity: null,
        cycleLength: null,
        menstrualCyclelengthID: null,
        menstrualFlowDurationID: null,
        bloodFlowDuration: null,
        menstrualProblemID: null,
        problemName: null,
      });
    } else {
      this.menstrualHistoryForm.patchValue({
        menstrualCycleStatusID: null,
        regularity: null,
        cycleLength: null,
        menstrualCyclelengthID: null,
        menstrualFlowDurationID: null,
        bloodFlowDuration: null,
        menstrualProblemID: null,
        problemName: null,
        lMPDate: null,
      });
    }
  }
}
