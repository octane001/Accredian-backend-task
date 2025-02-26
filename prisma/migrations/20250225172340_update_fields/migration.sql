/*
  Warnings:

  - You are about to drop the column `refereeEmail` on the `referral` table. All the data in the column will be lost.
  - You are about to drop the column `refereeName` on the `referral` table. All the data in the column will be lost.
  - You are about to drop the column `referrerEmail` on the `referral` table. All the data in the column will be lost.
  - You are about to drop the column `referrerName` on the `referral` table. All the data in the column will be lost.
  - Added the required column `course_name` to the `Referral` table without a default value. This is not possible if the table is not empty.
  - Added the required column `referee_email` to the `Referral` table without a default value. This is not possible if the table is not empty.
  - Added the required column `referee_name` to the `Referral` table without a default value. This is not possible if the table is not empty.
  - Added the required column `referrer_email` to the `Referral` table without a default value. This is not possible if the table is not empty.
  - Added the required column `referrer_name` to the `Referral` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX `Referral_refereeEmail_key` ON `referral`;

-- DropIndex
DROP INDEX `Referral_referrerEmail_key` ON `referral`;

-- AlterTable
ALTER TABLE `referral` DROP COLUMN `refereeEmail`,
    DROP COLUMN `refereeName`,
    DROP COLUMN `referrerEmail`,
    DROP COLUMN `referrerName`,
    ADD COLUMN `course_name` VARCHAR(191) NOT NULL,
    ADD COLUMN `referee_email` VARCHAR(191) NOT NULL,
    ADD COLUMN `referee_name` VARCHAR(191) NOT NULL,
    ADD COLUMN `referrer_email` VARCHAR(191) NOT NULL,
    ADD COLUMN `referrer_name` VARCHAR(191) NOT NULL;
