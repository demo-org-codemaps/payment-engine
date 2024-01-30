export class DeletionResponseDto {
  id: string;
  message: string;

  constructor(id: string, message = 'Deletion Successful') {
    this.id = id;
    this.message = message;
  }
}
