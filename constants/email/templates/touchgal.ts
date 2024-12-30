import { kunMoyuMoe } from '~/config/moyu-moe'

const iconImage = `${process.env.NEXT_PUBLIC_KUN_PATCH_ADDRESS_DEV}/favicon.webp`

export const touchgalTemplate = (title: string, content: string) => `
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${kunMoyuMoe.titleShort}</title>
    <!--[if mso]>
      <style>
        table {
          border-collapse: collapse;
          border-spacing: 0;
          border: none;
          margin: 0;
        }
        div,
        td {
          padding: 0;
        }
        div {
          margin: 0 !important;
        }
      </style>
      <noscript>
        <xml>
          <o:OfficeDocumentSettings>
            <o:PixelsPerInch>96</o:PixelsPerInch>
          </o:OfficeDocumentSettings>
        </xml>
      </noscript>
    <![endif]-->
    <style>
      body {
        margin: 0;
        padding: 0;
        width: 100% !important;
        -webkit-text-size-adjust: 100%;
        -ms-text-size-adjust: 100%;
      }

      img {
        max-width: 100%;
        outline: none;
        text-decoration: none;
        -ms-interpolation-mode: bicubic;
      }

      h1 {
        padding-left: 10px;
        color: #27272a;
      }

      .container {
        max-width: 600px;
        margin: 0 auto;
      }

      .header {
        background: #e6f1fe;
        color: white;
        padding: 30px;
        display: flex;
        justify-content: center;
        align-items: center;
        border-radius: 14px 14px 0 0;
      }

      .content {
        background: #ffffff;
        padding: 40px 30px;
        text-align: center;
        border-radius: 0 0 14px 14px;
      }

      .footer {
        color: #a1a1aa;
        font-size: 14px;
        margin-top: 36px;
        padding-top: 24px;
        border-top: 1px solid #e4e4e7;
        display: flex;
        justify-content: center;
        align-items: center;
      }

      a {
        color: #006FEE;
      }

      @media only screen and (max-width: 480px) {
        .container {
          width: 100% !important;
        }

        .content {
          padding: 30px 20px !important;
        }
      }
    </style>
  </head>
  <body style="background-color: #e4e4e7; padding: 40px 0">
    <div class="container">
      <div class="header">
        <img src="${iconImage}" />
        <h1 style="margin: 0; font-size: 24px; font-weight: 600">
          ${title}
        </h1>
      </div>
      <div class="content">
        ${content}
        <div class="footer">
          <p style="margin: 0;">此消息为系统自动发布, 请勿回复此消息, 如果有任何问题, 请联系 <a href="${kunMoyuMoe.domain.main}" target="_blank">TouchGal</a> </p>
        </div>
      </div>
    </div>
  </body>
</html>`
