const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
// const path = require('path');
// const fs = require('fs/promises');
// // const gravatar = require('gravatar');
// const Jimp = require('jimp');
// const { nanoid } = require('nanoid');

// const avatarsDir = path.join(__dirname, '../', 'public', 'avatars');

const { User } = require('../models/user');

// const { HttpError, ctrlWrapper, sendEmail } = require('../helpers');
const { HttpError, ctrlWrapper } = require("../helpers");

// const { SECRET_KEY, BASE_URL } = process.env;
const { SECRET_KEY } = process.env;

const register = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (user) {
    throw HttpError(409, 'Email already in use');
  }

  const hashPassword = await bcrypt.hash(password, 10);
  // // const avatarURL = gravatar.url(email);
  // const verificationToken = nanoid();

  const newUser = await User.create({
    ...req.body,
    password: hashPassword,
    // avatarURL,
    // verificationToken: verificationToken,
  });

  // const verifyEmail = {
  //   to: email,
  //   subject: 'Verify email',
  //   html: `<a target="_blank" href="${BASE_URL}/users/verify/${verificationToken}">Click verify email</a>`,
  // };

  // await sendEmail(verifyEmail);

  res.status(201).json({
    user: { email: newUser.email, name: newUser.name },
  });
};

// const verifyEmail = async (req, res) => {
//   const { verificationToken } = req.params;
//   const user = await User.findOne({ verificationToken });
//   if (!user) {
//     throw HttpError(404, 'User not found');
//   }
//   await User.findByIdAndUpdate(user._id, {
//     verify: true,
//     verificationToken: null,
//   });

//   res.status(200).json({
//     message: 'Verification successful',
//   });
// };

// const resendVerifyEmail = async (req, res) => {
//   const { email } = req.body;
//   const user = await User.findOne({ email });
//   if (!user) {
//     throw HttpError(401, 'Email not found, please try again.');
//   }
//   if (user.verify === true) {
//     throw HttpError(400, 'Verification has already been passed');
//   }

//   const verifyEmail = {
//     to: email,
//     subject: 'Verify email',
//     html: `<a target="_blank" href="${BASE_URL}/users/verify/${user.verificationToken}">Click verify email</a>`,
//   };

//   await sendEmail(verifyEmail);

//   res.status(200).json({
//     message: 'Verification email sent',
//   });
// };

const login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    throw HttpError(401, 'Email or password invalid');
  }
  // if (user.verify === false) {
  //   throw HttpError(401, 'Please Verification Email');
  // }
  const passwordCompare = await bcrypt.compare(password, user.password);
  if (!passwordCompare) {
    throw HttpError(401, 'Email or password invalid');
  }

  const payload = {
    id: user._id,
  };

  const token = jwt.sign(payload, SECRET_KEY, { expiresIn: '23h' });
  await User.findByIdAndUpdate(user._id, { token });

  res.status(200).json({
    token: token,
    user: { email: user.email, subscription: user.subscription },
  });
};

// const getCurrent = async (req, res) => {
//   const { email, subscription } = req.user;

//   res.json({
//     email,
//     subscription,
//   });
// };

const getCurrent = async (req, res) => {
  const { email, name } = req.user;

  res.json({
    email,
    name,
  });
};

const logout = async (req, res) => {
  const { _id } = req.user;
  await User.findByIdAndUpdate(_id, { token: '' });

  res.status(204).json();
};

// const updateSubscription = async (req, res) => {
//   console.log('hello world');
//   const { subscription } = req.body;
//   const { _id } = req.user;

//   const user = await User.findByIdAndUpdate(
//     _id,
//     { subscription },
//     {
//       new: true,
//     }
//   );

//   res.status(200).json({ email: user.email, subscription: user.subscription });
// };

// const updateAvatar = async (req, res) => {
//   const { _id } = req.user;
//   const { path: tempUpload, originalname } = req.file;
//   await Jimp.read(tempUpload)
//     .then(image => {
//       return image.resize(250, 250).write(tempUpload);
//     })
//     .catch(err => {
//       console.log(err.message);
//     });
//   const filename = `${_id}_${originalname}`;
//   const resultUpload = path.join(avatarsDir, filename);
//   await fs.rename(tempUpload, resultUpload);
//   const avatarURL = path.join('avatars', filename);
//   await User.findByIdAndUpdate(_id, { avatarURL });

//   res.json({
//     avatarURL,
//   });
// };

module.exports = {
  register: ctrlWrapper(register),
  login: ctrlWrapper(login),
  getCurrent: ctrlWrapper(getCurrent),
  logout: ctrlWrapper(logout),
  // updateSubscription: ctrlWrapper(updateSubscription),
  // updateAvatar: ctrlWrapper(updateAvatar),
  // verifyEmail: ctrlWrapper(verifyEmail),
  // resendVerifyEmail: ctrlWrapper(resendVerifyEmail),
};
