-- CreateTable
CREATE TABLE `Campeonato` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `descricao` VARCHAR(191) NULL,
    `tipoEsporte` ENUM('FUTEBOL', 'VOLEI', 'TENIS', 'BASQUETE', 'OUTROS') NOT NULL,
    `dataInicio` DATETIME(3) NOT NULL,
    `dataFim` DATETIME(3) NOT NULL,
    `valorInscricaoCentavos` INTEGER NOT NULL,
    `maxParticipantes` INTEGER NOT NULL,
    `status` ENUM('ABERTO', 'ENCERRADO', 'CANCELADO') NOT NULL DEFAULT 'ABERTO',
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizadoEm` DATETIME(3) NOT NULL,

    INDEX `Campeonato_tenantId_status_dataInicio_idx`(`tenantId`, `status`, `dataInicio`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CampeonatoInscricao` (
    `id` VARCHAR(191) NOT NULL,
    `campeonatoId` VARCHAR(191) NOT NULL,
    `usuarioId` VARCHAR(191) NOT NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `CampeonatoInscricao_usuarioId_criadoEm_idx`(`usuarioId`, `criadoEm`),
    UNIQUE INDEX `CampeonatoInscricao_campeonatoId_usuarioId_key`(`campeonatoId`, `usuarioId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Campeonato` ADD CONSTRAINT `Campeonato_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CampeonatoInscricao` ADD CONSTRAINT `CampeonatoInscricao_campeonatoId_fkey` FOREIGN KEY (`campeonatoId`) REFERENCES `Campeonato`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CampeonatoInscricao` ADD CONSTRAINT `CampeonatoInscricao_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `Usuario`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
