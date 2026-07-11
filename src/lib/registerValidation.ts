export type RegisterFormValues = {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export type RegisterFieldErrors = Partial<
  Record<keyof RegisterFormValues, string>
>;

const USERNAME_PATTERN = /^[a-zA-Z0-9_]*$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Client-side rules mirrored from CreateUserCommandValidator on the API.
 */
export function validateRegisterForm(
  values: RegisterFormValues,
): RegisterFieldErrors {
  const errors: RegisterFieldErrors = {};

  const firstName = values.firstName.trim();
  if (!firstName) {
    errors.firstName = "First name is required.";
  } else if (firstName.length > 50) {
    errors.firstName = "First name must be at most 50 characters.";
  }

  const lastName = values.lastName.trim();
  if (!lastName) {
    errors.lastName = "Last name is required.";
  } else if (lastName.length > 50) {
    errors.lastName = "Last name must be at most 50 characters.";
  }

  const username = values.username.trim();
  if (!username) {
    errors.username = "Username is required.";
  } else if (username.length < 3) {
    errors.username = "Username must be at least 3 characters.";
  } else if (username.length > 30) {
    errors.username = "Username must be at most 30 characters.";
  } else if (!USERNAME_PATTERN.test(username)) {
    errors.username =
      "Username can only contain letters, numbers, and underscores.";
  }

  const email = values.email.trim();
  if (!email) {
    errors.email = "Email is required.";
  } else if (!EMAIL_PATTERN.test(email)) {
    errors.email = "Email is not valid.";
  }

  const password = values.password;
  if (!password) {
    errors.password = "Password is required.";
  } else if (password.length < 8) {
    errors.password = "Password must be at least 8 characters.";
  } else if (!/[A-Z]/.test(password)) {
    errors.password = "Password must contain an uppercase letter.";
  } else if (!/[0-9]/.test(password)) {
    errors.password = "Password must contain a number.";
  } else if (!/[^a-zA-Z0-9]/.test(password)) {
    errors.password = "Password must contain a special character.";
  }

  if (!values.confirmPassword) {
    errors.confirmPassword = "Please confirm your password.";
  } else if (values.confirmPassword !== password) {
    errors.confirmPassword = "Passwords do not match.";
  }

  return errors;
}
