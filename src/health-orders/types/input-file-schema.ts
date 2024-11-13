export const inputFileSchema = {
  type: 'object',
  properties: {
    file: {
      type: 'string',
      format: 'binary',
      default: 'A file with .png, .jpg and .pdf extension is allowed',
    },
    additionalNotes: {
      type: 'string',
      example: 'We are still pending total Glucose example',
    },
  },
  required: ['file'],
};
