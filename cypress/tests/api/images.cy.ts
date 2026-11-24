describe("product images API", () => {
  const alarmClockSku = "BED-10331";
  const otherSku = "BED-10332";
  const alarmClockImage = "fixtures/images/black-analog-alarm-clock.jpg";

  let uploadedImageId = "";
  let uploadedImageUrl = "";

  const login = (email: string) =>
    cy
      .request("POST", "/api/login", { email, password: "datalab" })
      .its("status")
      .should("eq", 200);

  /** Copy into a fresh ArrayBuffer-backed view so BlobPart typing accepts it. */
  function jpegBlob(bytes: Uint8Array) {
    const copy = new Uint8Array(bytes.byteLength);
    copy.set(bytes);
    return new Blob([copy], { type: "image/jpeg" });
  }

  it("includes imageUrl on products and serves public image bytes", () => {
    login("customer@marlow.test");
    cy.request("GET", `/api/products/${encodeURIComponent(otherSku)}`).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body.product.imageUrl).to.match(/^\/api\/images\//);
      cy.clearCookies();
      cy.request({
        method: "GET",
        url: response.body.product.imageUrl,
        encoding: "binary",
      }).then((image) => {
        expect(image.status).to.eq(200);
        expect(image.headers["content-type"]).to.match(/^image\//);
        expect(image.body.length).to.be.greaterThan(0);
      });
    });
  });

  it("staff uploads the Black Analog Alarm Clock catalog JPEG", () => {
    login("staff@marlow.test");
    cy.readFile(alarmClockImage, null).then((file) => {
      const bytes = file instanceof Uint8Array ? file : new Uint8Array(file as ArrayBuffer);
      expect(bytes.byteLength).to.be.greaterThan(10_000);

      const form = new FormData();
      form.set("file", jpegBlob(bytes), "black-analog-alarm-clock.jpg");

      cy.request({
        method: "POST",
        url: `/api/products/${encodeURIComponent(alarmClockSku)}/image`,
        body: form,
      }).then((upload) => {
        expect(upload.status).to.eq(201);
        expect(upload.body.image).to.include({
          sku: alarmClockSku,
          contentType: "image/jpeg",
          isPrimary: true,
        });
        expect(upload.body.image.imageUrl).to.match(/^\/api\/images\//);
        expect(upload.body.image.byteSize).to.eq(bytes.byteLength);

        uploadedImageId = upload.body.image.id as string;
        uploadedImageUrl = upload.body.image.imageUrl as string;

        cy.request({
          method: "GET",
          url: uploadedImageUrl,
          encoding: "binary",
        }).then((image) => {
          expect(image.status).to.eq(200);
          expect(image.headers["content-type"]).to.match(/image\/jpeg/);
          expect(image.body.length).to.eq(bytes.byteLength);
        });

        cy.request("GET", `/api/products/${encodeURIComponent(alarmClockSku)}`).then((product) => {
          expect(product.status).to.eq(200);
          expect(product.body.product.name).to.eq("Black Analog Alarm Clock");
          expect(product.body.product.imageUrl).to.eq(uploadedImageUrl);
        });
      });
    });
  });

  it("staff removes the uploaded Black Analog Alarm Clock image", () => {
    expect(uploadedImageId).to.not.equal("");
    login("staff@marlow.test");
    cy.request(
      "DELETE",
      `/api/products/${encodeURIComponent(alarmClockSku)}/image/${encodeURIComponent(uploadedImageId)}`,
    ).then((deleted) => {
      expect(deleted.status).to.eq(200);
      expect(deleted.body).to.deep.include({ id: uploadedImageId, deleted: true });
    });

    cy.request({
      method: "GET",
      url: uploadedImageUrl,
      failOnStatusCode: false,
      encoding: "binary",
    }).then((image) => {
      expect(image.status).to.eq(404);
    });

    cy.request("GET", `/api/products/${encodeURIComponent(alarmClockSku)}`).then((product) => {
      expect(product.status).to.eq(200);
      expect(product.body.product.imageId).to.eq(null);
      expect(product.body.product.imageUrl).to.eq(null);
    });
  });

  it("rejects customer image uploads", () => {
    login("customer@marlow.test");
    cy.readFile(alarmClockImage, null).then((file) => {
      const bytes = file instanceof Uint8Array ? file : new Uint8Array(file as ArrayBuffer);
      const form = new FormData();
      form.set("file", jpegBlob(bytes), "black-analog-alarm-clock.jpg");
      cy.request({
        method: "POST",
        url: `/api/products/${encodeURIComponent(alarmClockSku)}/image`,
        body: form,
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(403);
        expect(response.body).to.have.property("error");
      });
    });
  });
});
