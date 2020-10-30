import { Component, OnInit } from '@angular/core';
import { ToastrService } from "ngx-toastr";
import { Router } from "@angular/router";
// services
import { AuthService } from "src/app/services/auth.service";

// angular form
import { NgForm } from "@angular/forms";

import { finalize } from "rxjs/operators";
// firebase
import { AngularFireStorage } from "@angular/fire/storage";
import { AngularFireDatabase } from "@angular/fire/database";

// browser image resizer
import { readAndCompressImage } from 'browser-image-resizer';
import { imageConfig } from './../../../utils/config';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css']
})
export class SignupComponent implements OnInit {
  // tslint:disable-next-line: ban-types
  picture: String = 'https://learnyst.s3.amazonaws.com/assets/schools/2410/resources/images/logo_lco_i3oab.png';

   uploadPercent: number = null;
  constructor(
    private auth: AuthService,
    private router: Router,
    private db: AngularFireDatabase,
    private storage: AngularFireStorage,
    private toastr: ToastrService,
  ) { }

  ngOnInit(): void {
  }

   // tslint:disable-next-line: typedef
   onSubmit(f: NgForm) {
    const { email, password, username, country, bio, name } = f.form.value;

     // further sanitization - do here

    this.auth.signUp(email, password)
      .then((res) => {
        console.log(res);
        const { uid } = res.user;

        this.db.object(`/users/${uid}`)
          .set({
            id: uid,
            name,
            email,
            instaUserName: username,
            country,
            bio,
            picture: this.picture,
          });
      })
      .then(() => {
        this.router.navigateByUrl("/");
        this.toastr.success('SignUp Success');
      })
      .catch((err) => {
        this.toastr.error('Signup failed');
      });
  }

 // tslint:disable-next-line: typedef
 async uploadFile(event: any) {
    const file = event.target.files[0];

    const resizedImage = await readAndCompressImage(file, imageConfig);

    const filePath = file.name; // rename the image with TODO: UUID
    const fileRef = this.storage.ref(filePath);

    const task = this.storage.upload(filePath, resizedImage);

    task.percentageChanges().subscribe((percentage) => {
      this.uploadPercent = percentage;
    });

    task.snapshotChanges()
      .pipe(
        finalize(() => {
          fileRef.getDownloadURL().subscribe((url) => {
            this.picture = url;
            this.toastr.success('image upload success');
          });
        }),
      )
      .subscribe();
 }
}
