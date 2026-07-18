export type ProfileFormValues = {
  firstName: string;
  lastName: string;
  imageUrl: string;
  imagePublicId: string;
};

export type ProfileFieldErrors = Partial<Record<keyof ProfileFormValues, string>>;

export type ChangePasswordFormValues = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export type ChangePasswordFieldErrors = Partial<
  Record<keyof ChangePasswordFormValues, string>
>;

/**
 * Client-side rules mirrored from UpdateProfileCommandValidator (names only;
 * images are validated as files before upload).
 */
export function validateProfileForm(
  values: ProfileFormValues,
): ProfileFieldErrors {
  const errors: ProfileFieldErrors = {};

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

  return errors;
}

/**
 * Client-side rules mirrored from ChangePasswordCommandValidator / register.
 */
export function validateChangePasswordForm(
  values: ChangePasswordFormValues,
): ChangePasswordFieldErrors {
  const errors: ChangePasswordFieldErrors = {};

  if (!values.currentPassword) {
    errors.currentPassword = "Current password is required.";
  }

  const password = values.newPassword;
  if (!password) {
    errors.newPassword = "New password is required.";
  } else if (password.length < 8) {
    errors.newPassword = "Password must be at least 8 characters.";
  } else if (!/[A-Z]/.test(password)) {
    errors.newPassword = "Password must contain an uppercase letter.";
  } else if (!/[0-9]/.test(password)) {
    errors.newPassword = "Password must contain a number.";
  } else if (!/[^a-zA-Z0-9]/.test(password)) {
    errors.newPassword = "Password must contain a special character.";
  } else if (password === values.currentPassword) {
    errors.newPassword = "New password must be different from the current password.";
  }

  if (!values.confirmPassword) {
    errors.confirmPassword = "Please confirm your new password.";
  } else if (values.confirmPassword !== password) {
    errors.confirmPassword = "Passwords do not match.";
  }

  return errors;
}
