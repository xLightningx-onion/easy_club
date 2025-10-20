import Dropzone from "dropzone";
import Cropper from "cropperjs";
import { Controller } from "stimulus";
import { DirectUpload } from "@rails/activestorage";
import {
  getMetaValue,
  toArray,
  findElement,
  removeElement,
  insertAfter
} from "../helpers";

// Connects to data-controller="dropzone"
export default class extends Controller {
  static targets = ["input"];

  cropped = false;

  connect() {
    console.log("ocnnected dropzone")
    this.dropZone = createDropZone(this);
    this.hideFileInput();
    this.bindEvents();
    Dropzone.autoDiscover = false; // necessary quirk for Dropzone error in console
  }

  // Private
  hideFileInput() {
    this.inputTarget.disabled = true;
    this.inputTarget.style.display = "none";
  }

  bindEvents() {
    this.dropZone.on("processing", (file) => {
      this.toggleSubmitButton(false);
    });
  
    this.dropZone.on("addedfile", file => {
      this.toggleSubmitButton(false);
      setTimeout(() => {
        if (this.element.hasAttribute("data-crop-image") && !this.cropped) {
          this.initializeCropper(file, this.element.getAttribute("data-crop-image-aspect-ratio"), this.element.getAttribute("data-crop-image-width"), this.element.getAttribute("data-crop-image-height"));
        } else {
          this.startUpload(file);
        }
      }, 400);
    });

    this.dropZone.on("removedfile", file => {
      if (this.cropped == true) {
        this.cropped = false
      }
      file.controller && removeElement(file.controller.hiddenInput);
    });

    this.dropZone.on("canceled", file => {
      file.controller && file.controller.xhr.abort();
    });

    this.dropZone.on("complete", (file) => {
      this.toggleSubmitButton(true);
    });

    this.dropZone.uploadFiles = this.fakeUploadProgress.bind(this.dropZone);
  }

  initializeCropper(file, aspectRatio = "1 / 1", width = 500, height = 500) {
    const fileReader = new FileReader();

    fileReader.onload = () => {
      const image = new Image();
      image.src = fileReader.result;

      // Create a modal or container for cropping
      const cropModal = document.createElement("div");
      cropModal.className = "fixed inset-0 z-50 flex items-center justify-center bg-black/60";
      cropModal.innerHTML = `
        <div class="w-full max-w-lg overflow-hidden rounded-lg bg-white shadow-2xl">
          <div id="cropperImageContainer" class="max-h-[70vh] overflow-hidden bg-slate-100">
            <img id="cropperImage" class="block h-full w-full object-contain" src="${image.src}" alt="Cropper preview" />
          </div>
          <div class="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 p-4">
            <button id="crop-cancel-button" type="button" class="inline-flex items-center justify-center rounded border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">Cancel</button>
            <button id="crop-save-button" type="button" class="inline-flex items-center justify-center rounded bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800">Crop</button>
          </div>
        </div>
      `;
      document.body.style.overflow = "hidden";
      document.body.appendChild(cropModal);

      const cropperImage = document.getElementById("cropperImage");
      let cropper;
      const aspect = aspectRatio ? (aspectRatio.includes("/") ? eval(aspectRatio) : parseFloat(aspectRatio)) : 1;
      setTimeout(() => {
        const containerRect = document.getElementById("cropperImageContainer").getBoundingClientRect();

        cropper = new Cropper(cropperImage, {
          aspectRatio: aspect,
          viewMode: 1,
          rotatable: false,
          cropBoxMovable: false,
          cropBoxResizable: false,
          dragMode: "move",
          guides: false,
          responsive: true,
          minContainerWidth: containerRect.width,
          minContainerHeight: containerRect.height
        });
      }, 200);

      const closeModal = () => {
        cropper && cropper.destroy();
        if (cropModal.parentNode) {
          cropModal.parentNode.removeChild(cropModal);
        }
        document.body.style.overflow = "";
      };

      cropModal.querySelector("#crop-cancel-button").addEventListener("click", () => {
        this.cropped = false;
        closeModal();
      });

      cropModal.querySelector("#crop-save-button").addEventListener("click", () => {
        cropper.getCroppedCanvas({ width: width, height: height }).toBlob((blob) => {
          const croppedFile = new File([blob], file.name, { type: "image/jpeg" });
          this.dropZone.removeFile(file);
          const addedFile = this.dropZone.addFile(croppedFile);
          if (addedFile && addedFile[0]) {
            this.dropZone.emit("thumbnail", addedFile[0], URL.createObjectURL(croppedFile));
          }
          this.cropped = true;
          closeModal();
        }, "image/jpeg");
      });

      // document.getElementById('closeModal').addEventListener('click', () => {
      //   const modal = document.getElementById('cropperModal');
      //   modal.hide();
      //   cropper.destroy();
      // });
    };

    fileReader.readAsDataURL(file);
  }

  startUpload(file) {
    file.accepted && createDirectUploadController(this, file).start();
  }

  toggleSubmitButton(enable) {
    const submitButton = this.element.closest("form")?.querySelector('button[type="submit"]');
    if (submitButton) {
      submitButton.disabled = !enable;
    }
  }

  fakeUploadProgress(files) {
    files.forEach((file) => {
      const minSteps = 6;
      const maxSteps = 60;
      const timeBetweenSteps = 100;
      const bytesPerStep = 100000;
      const totalSteps = Math.round(Math.min(maxSteps, Math.max(minSteps, file.size / bytesPerStep)));

      for (let step = 0; step < totalSteps; step++) {
        const duration = timeBetweenSteps * (step + 1);
        setTimeout(() => {
          file.upload = {
            progress: 100 * (step + 1) / totalSteps,
            total: file.size,
            bytesSent: (step + 1) * file.size / totalSteps,
          };

          this.emit("uploadprogress", file, file.upload.progress, file.upload.bytesSent);
          if (file.upload.progress === 100) {
            file.status = Dropzone.SUCCESS;
            this.emit("success", file, "success", null);
            this.emit("complete", file);
            this.processQueue();
          }
        }, duration);
      }
    });
  }


  get headers() {
    return { "X-CSRF-Token": getMetaValue("csrf-token") };
  }

  get url() {
    return this.inputTarget.getAttribute("data-direct-upload-url");
  }

  get maxFiles() {
    return this.data.get("maxFiles") || 1;
  }

  get maxFileSize() {
    return this.data.get("maxFileSize") || 256;
  }

  get acceptedFiles() {
    return this.data.get("acceptedFiles");
  }

  get addRemoveLinks() {
    return this.data.get("addRemoveLinks") || true;
  }
}

class DirectUploadController {
  constructor(source, file) {
    this.directUpload = createDirectUpload(file, source.url, this);
    this.source = source;
    this.file = file;
  }

  start() {
    this.file.controller = this;
    this.hiddenInput = this.createHiddenInput();
    this.directUpload.create((error, attributes) => {
      if (error) {
        removeElement(this.hiddenInput);
        this.emitDropzoneError(error);
      } else {
        this.hiddenInput.value = attributes.signed_id;
        this.emitDropzoneSuccess();
      }
    });
  }

  createHiddenInput() {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = this.source.inputTarget.name;
    insertAfter(input, this.source.inputTarget);
    return input;
  }

  directUploadWillStoreFileWithXHR(xhr) {
    this.bindProgressEvent(xhr);
    this.emitDropzoneUploading();
  }

  bindProgressEvent(xhr) {
    this.xhr = xhr;
    this.xhr.upload.addEventListener("progress", event =>
      this.uploadRequestDidProgress(event)
    );
  }

  uploadRequestDidProgress(event) {
    const element = this.source.element;
    const progress = (event.loaded / event.total) * 100;
    findElement(
      this.file.previewTemplate,
      ".dz-upload"
    ).style.width = `${progress}%`;
  }

  emitDropzoneUploading() {
    this.file.status = Dropzone.UPLOADING;
    this.source.dropZone.emit("processing", this.file);
  }

  emitDropzoneError(error) {
    this.file.status = Dropzone.ERROR;
    this.source.dropZone.emit("error", this.file, error);
    this.source.dropZone.emit("complete", this.file);
  }

  emitDropzoneSuccess() {
    this.file.status = Dropzone.SUCCESS;
    this.source.dropZone.emit("success", this.file);
    this.source.dropZone.emit("complete", this.file);
  }
}

function createDirectUploadController(source, file) {
  return new DirectUploadController(source, file);
}

function createDirectUpload(file, url, controller) {
  return new DirectUpload(file, url, controller);
}

function createDropZone(controller) {
  return new Dropzone(controller.element, {
    url: controller.url,
    headers: controller.headers,
    maxFiles: controller.maxFiles,
    maxFilesize: controller.maxFileSize,
    acceptedFiles: controller.acceptedFiles,
    addRemoveLinks: controller.addRemoveLinks,
    autoQueue: false
  });
}
